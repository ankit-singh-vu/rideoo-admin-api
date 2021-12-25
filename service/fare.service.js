const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const User = db.Fare;

const AWS = require('aws-sdk');

const fs = require('fs');
const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});

module.exports = {
    authenticate,
    getAll,
    getById,
    search: search,
    create,
    update,
    delete: _delete
};

async function authenticate({ email, password }) {
    const user = await User.findOne({ email });
    if (user && bcrypt.compareSync(password, user.hash)) {
        const token = jwt.sign({ sub: user.id }, config.secret, { expiresIn: '7d' });
        return {
            ...user.toJSON(),
            token
        };
    }
}

async function getAll() {
    // return await User.find();
    const user = await User.find().populate("carCategory", "name image");
    return user;

}

async function getById(id) {
    return await User.findById(id);
}

async function search(userParam) {
    let val;
    for(var i in userParam){
        val=userParam[i];
    }
    let q;
    //name and email
    q={ $or: [{ 'name': { $regex:  val, $options: 'i'} }, { 'email': { $regex:  val, $options: 'i'} }] };
    //name 
    // q={name:  {$regex:val,$options: 'i'}};
    return await User.find(q);
}

async function create(userParam) {
    // validate
    // if (await User.findOne({ email: userParam.email })) {
    //     throw 'email "' + userParam.email + '" is already taken';
    // }

    let user = new User(userParam);
    // save user
    // return await user.save();
    user= await user.save();

    const userCars = await User.findById(user.id).populate("carCategory", "name image");   
    if(userCars.carCategory.image) userCars.carCategory.image = await getSignedUrl(userCars.carCategory.image);
    return userCars;    
}

async function update(id, userParam) {
    let user = await User.findById(id);
    // validate
    if (!user) throw 'carCategory not found';
    // copy userParam properties to user
    Object.assign(user, userParam);
    console.log(user)
    // return await user.save();
    user= await user.save();

    const userCars = await User.findById(user.id).populate("carCategory", "name image");   
    if(userCars.carCategory.image) userCars.carCategory.image = await getSignedUrl(userCars.carCategory.image);
    return userCars;
}

async function _delete(id) {
    await User.findByIdAndRemove(id);
}


async function getSignedUrl(keyName){
    try {
        const s3 = new AWS.S3({
            signatureVersion: 'v4',
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        });
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: keyName
        };
        
        const headCode = await s3.headObject(params).promise();
        if(headCode){
            const signedUrl = s3.getSignedUrl('getObject', params);
            return signedUrl;
        }else{
            throw new Error('Sorry! File not found')
        }
    } catch (error) {
        if (error.code === 'NotFound' || error.code === 'Forbidden') {
            throw new Error('Sorry! File not found')
        }
    }
    
}