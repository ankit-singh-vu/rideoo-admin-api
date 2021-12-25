const express = require('express');
const router = express.Router();
const userService = require('../service/fare.service');
const db = require('_helpers/db');
const User = db.Fare;
const AWS = require('aws-sdk');

const fs = require('fs');
const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});


// routes
// router.post('/admin-sign-up', register);
router.post('/admin-authenticate', authenticate);
router.post('/create', create);

router.get('/', getAll);
router.get('/search', search);
// router.get('/hi', hi);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'email or password is incorrect' }))
        .catch(err => next(err));
}

function create(req, res, next) {
    userService.create(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}

// function getAll(req, res, next) {
//     userService.getAll()
//         .then(users => res.json(users))
//         .catch(err => next(err));
// }

function search(req, res, next) {
    userService.search(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}

// function hi(req, res, next) {
//     userService.getAll()
//         .then(users => res.json(users))
//         .catch(err => next(err));
//     // res.send('Hi!')
// // process.exit();
// }

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

// function getById(req, res, next) {
//     userService.getById(req.params.id)
//         .then(user => user ? res.json(user) : res.sendStatus(404))
//         .catch(err => next(err));
// }


function update(req, res, next) {
    userService.update(req.params.id, req.body)
        // .then(() => res.json({}))
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}


function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}



// async function update(req, res){
//     try {
//         let user = await User.findById(req.params.id);

//         // validate
//         if (!user) throw 'carCategory not found';
    
//         // copy userParam properties to user
//         console.log(res.body)
//         Object.assign(user, res.body);
//         user= await user.save();

//         console.log(user)
//         console.log(user.id)


//         const userCars = await User.findById(user.id).populate("carCategory", "name image");   
//         if(userCars.carCategory.image) userCars.carCategory.image = await getSignedUrl(userCars.carCategory.image);
//         return res.status(200).json(userCars);
//         // return res.status(200).json({ status:'success', data: userCars });
//     } catch (error) {
//         return res.status(400).json({ status:'error', error: error.message });
//     }
// }


async function getById(req, res){
    try {
        const userCars = await User.findById(req.params.id).populate("carCategory", "name image");        
        if(userCars.carCategory.image) userCars.carCategory.image = await getSignedUrl(userCars.carCategory.image);
        return res.status(200).json(userCars);
        // return res.status(200).json({ status:'success', data: userCars });
    } catch (error) {
        return res.status(400).json({ status:'error', error: error.message });
    }
}

async function getAll(req, res){
    try {
        const userCars = await User.find().populate("carCategory", "name");
        // const userCars = await User.find().populate("carCategory", "name image");
        // for(let i=0; i < userCars.length; i++){
        //     if(userCars[i].carCategory.image) userCars[i].carCategory.image = await getSignedUrl(userCars[i].carCategory.image);
        // }            
        return res.status(200).json(userCars);
        // return res.status(200).json({ status:'success', data: userCars });
    } catch (error) {
        return res.status(400).json({ status:'error', error: error.message });
    }
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