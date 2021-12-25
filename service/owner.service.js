const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const AWS = require('aws-sdk');
const fs = require('fs');

const Owner = db.Owner;
const Car = db.Car;
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
    const user = await Owner.findOne({ email });
    if (user && bcrypt.compareSync(password, user.hash)) {
        const token = jwt.sign({ sub: user.id }, config.secret, { expiresIn: '7d' });
        return {
            ...user.toJSON(),
            token
        };
    }
}

function getFilters(req) {
    let filter={}
    // console.log(req.query)

    if(req.query.is_delete) filter.is_delete=req.query.is_delete;
    
    if(req.query.name) filter.name={$regex:req.query.name,$options: 'i'};    
    if(req.query.email) filter.email={$regex:req.query.email,$options: 'i'};    
    if(req.query.phone) filter.phone={$regex:req.query.phone,$options: 'i'};    
    if(req.query.status) filter.status={$regex:req.query.status,$options: 'i'};       

    let order;
    order = -1//desc
    if(req.query.order) order=req.query.order;
    // console.log(filter)
    var f={
        filter:filter,
        order:order
    }
    return f;

}

async function getAll(req) {
    let f=getFilters(req)
    let user=await Owner.find(f.filter,null, {sort: {createdAt: f.order}}).select("-refreshToken -password -documents").lean();

    if(user){
        for(let u=0; u < user.length; u++){
            user[u].cars_count=(user[u].cars)?user[u].cars.length : 0;
            user[u].phone=(user[u].phone)?user[u].phone : null;
            user[u].type=(user[u].type)?user[u].type : null;
            // user[u].status=(user[u].status)?user[u].status : null;
            //     if(user[u].documents){
            //         for(let i=0; i < user[u].documents.length; i++){
            //             user[u].documents[i].filename = await getSignedUrl(user[u].documents[i].filename);
            //         }
            //     }
            // console.log(user)
        }
    }
    return user;
}

async function getById(id) {
    // return await Owner.findById();
    let user=await Owner.findById(id).select("-refreshToken -password");
    if(user.documents){
        for(let i=0; i < user.documents.length; i++){
            user.documents[i].filename = await getSignedUrl(user.documents[i].filename);
        }
    }
    return user;
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
    return await Owner.find(q);
}

// async function create(req) {
//     // console.log("hi")

//     let userParam=req.body;
//     // console.log(req.files)
//     // validate
//     if (await Owner.findOne({ email: userParam.email })) {
//         throw 'email "' + userParam.email + '" is already taken';
//     }

//     let user = new Owner(userParam);

//     // // hash password
//     if (userParam.password) {
//         user.hash = bcrypt.hashSync(userParam.password, 10);
//     }

//     if(req.files){
//         // console.log(req.files)
//         // console.log(req.files.profileImage)
//         const allowType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
//         if(req.files.profileImage){
//             const uploadedFile = req.files.profileImage;
//             user.profilePic = await fileUpload(uploadedFile,"Profile Photo",allowType);
//         }
//         if(req.files.driving_license_front){
//             const uploadedFile = req.files.driving_license_front;
//             const  filename= await fileUpload(uploadedFile,"driving_license_front",allowType);
//             const obj=add_doc("driving_license_front", filename)
//             user.documents.push(obj);
//         }
//         if(req.files.driving_license_back){
//             const uploadedFile = req.files.driving_license_back;
//             const  filename= await fileUpload(uploadedFile,"driving_license_back",allowType);
//             const obj=add_doc("driving_license_back", filename)
//             user.documents.push(obj);
//         }

//     }

//     user = await user.save();
//     let car = new Car(userParam);

//     let profileImage ="", carImage = "", insuranceDoc = "", rcDoc = "", permitDoc = "", fitnessDoc = "";
//     if(req.files){
//         const allowType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
//         if(req.files.profileImage){
//             const uploadedFile = req.files.profileImage;
//             profileImage = await fileUpload(uploadedFile,"Profile Photo",allowType);
//         }
//         if(req.files.carImage){
//             const uploadedFile = req.files.carImage;
//             carImage = await fileUpload(uploadedFile,"Car Photo",allowType);
//         }
//         if(req.files.insuranceDoc){
//             const uploadedFile = req.files.insuranceDoc;
//             insuranceDoc = await fileUpload(uploadedFile,"Insurance Paper",allowType);
//         }
//         if(req.files.rcDoc){
//             const uploadedFile = req.files.rcDoc;
//             rcDoc = await fileUpload(uploadedFile,"RC Paper",allowType);
//         }
//         if(req.files.permitDoc){
//             const uploadedFile = req.files.permitDoc;
//             permitDoc = await fileUpload(uploadedFile,"Permit Paper",allowType);
//         }
//         if(req.files.fitnessDoc){
//             const uploadedFile = req.files.fitnessDoc;
//             fitnessDoc = await fileUpload(uploadedFile,"Fitness Paper",allowType);
//         }
//     }

//     car.driver=user.id;

//     car.carImage=carImage;
//     car.insuranceDoc=insuranceDoc;
//     car.rcDoc=rcDoc;
//     car.permitDoc=permitDoc;
//     car.fitnessDoc=fitnessDoc;
//     car = await car.save();
//     // return car;
//     return {};
// }

async function create(req) {

    let userParam=req.body;
    // console.log(userParam)
    // validate
    if (await Owner.findOne({ email: userParam.email })) {
        throw 'email "' + userParam.email + '" is already taken';
    }

    let user = new Owner(userParam);

    // // hash password
    if (userParam.password) {
        user.hash = bcrypt.hashSync(userParam.password, 10);
    }

    if(req.files){
        // console.log(req.files)
        // console.log(req.files.profileImage)
        const allowType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        if(req.files.profilePic){
            const uploadedFile = req.files.profilePic;
            const  filename = await fileUpload(uploadedFile,"Profile Photo",allowType);
            const obj=add_doc("Profile Photo", filename)
            user.documents.push(obj);
        }

        if(req.files.adhar_card_front){
            const uploadedFile = req.files.adhar_card_front;
            const  filename= await fileUpload(uploadedFile,"adhar_card_front",allowType);
            const obj=add_doc("Adhaar Card (Front)", filename)
            user.documents.push(obj);
        }
        if(req.files.adhar_card_back){
            const uploadedFile = req.files.adhar_card_back;
            const  filename= await fileUpload(uploadedFile,"adhar_card_back",allowType);
            const obj=add_doc("Adhaar Card (Back)", filename)
            user.documents.push(obj);
        }
        if(req.files.pan_card){
            const uploadedFile = req.files.pan_card;
            const  filename= await fileUpload(uploadedFile,"pan_card",allowType);
            const obj=add_doc("Pan Card", filename)
            user.documents.push(obj);
        }
        if(req.files.bank_passbook){
            const uploadedFile = req.files.bank_passbook;
            const  filename= await fileUpload(uploadedFile,"bank_passbook",allowType);
            const obj=add_doc("Bank Passbook", filename)
            user.documents.push(obj);
        }

    }

    // console.log(user);
    // save user
    // return user;
    // return await user.save();
    user = await user.save();
    // user = await Owner.findById(user.id).select("-refreshToken -password");
    // if(user.documents){
    //     for(let i=0; i < user.documents.length; i++){
    //         user.documents[i].filename = await getSignedUrl(user.documents[i].filename);
    //     }
    // }
    // if(user.profilePic){
    //     user.profilePic = await getSignedUrl(user.profilePic);
    // }

    
    return user;



}

function add_doc(name, filename) {
    const obj={
        name: name,
        filename: filename
    } 
    return obj;
}

async function update(id, userParam) {
    let user = await Owner.findById(id);

    // validate
    if (!user) throw 'Owner not found';
    if (user.email !== userParam.email && await Owner.findOne({ email: userParam.email })) {
        throw 'email "' + userParam.email + '" is already taken';
    }

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);
    console.log(user)
    return await user.save();
}

async function _delete(id) {
    await Owner.findByIdAndRemove(id);
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

// profilePic = await fileUpload(uploadedFile,"Profile Photo",allowType);

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