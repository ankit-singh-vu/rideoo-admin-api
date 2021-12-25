const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const User = db.carCategory;
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
    return await User.find();
    // return await Drivers.find();
    // console.log("hi");
}

async function getById(id) {
    
    let carCategory=await User.findById(id);
    console.log(carCategory.image)

    if(carCategory.image) carCategory.image = await getSignedUrl(carCategory.image);

  
    console.log(carCategory.image)
    return carCategory;
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

async function create(req) {
    let userParam=req.body;


    let image ="";
    if(req.files){
        console.log(req.files)
        console.log(req.files.image)
        const allowType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        if(req.files.image){
            const uploadedFile = req.files.image;
            image = await fileUpload(uploadedFile,"Car Category Photo",allowType);
        }
    }

    let user = new User(userParam);
    user.image=image;

    // console.log(user)
    user = await user.save();
    if(user.image) user.image = await getSignedUrl(user.image);

    return user;

}



async function update(req) {
    let userParam=req.body;
    let user = await User.findById(req.params.id);

    // validate
    if (!user) throw 'carCategory not found';

    if(req.files){
        // console.log(req.files)
        // console.log(req.files.image)
        const allowType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        if(req.files.image){
            const uploadedFile = req.files.image;
            user.image = await fileUpload(uploadedFile,"Car Category Photo",allowType);
        }
    }
    // console.log(user)

    // copy userParam properties to user
    Object.assign(user, userParam);
    user = await user.save();

    if(user.image) user.image = await getSignedUrl(user.image);
    return user;
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


async function fileUpload(requestFile,fileName,allowType){
    try {
        return new Promise(function(resolve, reject) {
            const uploadedFile = requestFile;
            if(allowType.includes(uploadedFile.mimetype)) {
                let uploadedFileName = uploadedFile.name;
                const filenameSplit = uploadedFileName.split('.');
                const fileExtension = filenameSplit[filenameSplit.length-1];
                uploadedFileName = fileName.toLowerCase().replace(" ", "-") +'-'+ Date.now()+ '.' + fileExtension;
                fs.readFile(uploadedFile.tempFilePath, (err, uploadedData) => {
                    const params = {
                        Bucket: process.env.BUCKET_NAME,
                        Key: "images/"+ uploadedFileName, // File name you want to save as in S3
                        Body: uploadedData 
                    };
                    s3.upload(params, async (err, data) => {
                        if (err) {
                            return reject("Sorry! File upload failed. " + err.message);
                        }else{
                            resolve(data.Key);
                        }
                    });
                });
            }else{
                return reject("Sorry! Invalid File.");
            }
        });
    } catch (error) {
        return reject(error.message);
    }
}