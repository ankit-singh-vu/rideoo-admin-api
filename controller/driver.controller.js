const express = require('express');
const router = express.Router();
const userService = require('../service/driver.service');
const fs = require('fs');


const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});

const db = require('_helpers/db');

const Driver = db.Driver;

// routes
// router.post('/admin-sign-up', register);
router.post('/admin-authenticate', authenticate);
router.post('/create', create);
router.patch('/upload-document', documentsUpload);
router.patch('/update-document', updateDocument);
router.delete('/delete-document', removeDocument);
router.patch('/driver-approve-document', driverApproveDocument);
router.patch('/driver-reject-document', driverRejectDocument);
router.patch('/driver-approve-document', driverApproveDocument);
router.patch('/driver-reject-document', driverRejectDocument);

router.patch('/change-document-status', ChangeDocumentStatus);
router.patch('/change-document-status-car', ChangeDocumentStatusCar);
router.patch('/change-driver-status', ChangeDriverStatus);

router.get('/', getAll);
router.get('/search', search);
// router.get('/hi', hi);
router.get('/current', getCurrent);
router.get('/for-edit/:id', forEdit);
router.get('/bookings/:id', bookings);
router.get('/stats/:id', stats);
router.get('/location/:id', location);

router.get('/:id', getById);
router.put('/:id', update);
router.delete('/soft-delete/:id', soft_delete);
router.delete('/:id', permanent_delete);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'email or password is incorrect' }))
        .catch(err => next(err));
}

function create(req, res, next) {
    // userService.create(req.body)
    userService.create(req)
        .then(users => res.json(users))
        // .then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    userService.getAll(req)
        .then(users => res.json(users))
        .catch(err => next(err));
}

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

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}
function bookings(req, res, next) {
    userService.bookings(req)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function stats(req, res, next) {
    userService.stats(req)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function location(req, res, next) {
    userService.location(req)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function forEdit(req, res, next) {
    userService.forEdit(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    userService.update(req.params.id, req.body)
        // .then(() => res.json({}))
        .then(user => user ? res.json(user) : res.sendStatus(404))
        // .then(user => user ? res.json({ status: 'success' ,data: user}) : res.sendStatus(404))
        // { status:'error', error: "Sorry! Something went wrong." }
        .catch(err => next(err));
        
}

function driverApproveDocument(req, res, next) {
    userService.driverApproveDocument(req)
        // .then(() => res.json({}))
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
        
}

function driverRejectDocument(req, res, next) {
    userService.driverRejectDocument(req)
        // .then(() => res.json({}))
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
        
}

function ChangeDocumentStatus(req, res, next) {
    userService.ChangeDocumentStatus(req)
        // .then(() => res.json({}))
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
        
}

function ChangeDocumentStatusCar(req, res, next) {
    userService.ChangeDocumentStatusCar(req)
        // .then(() => res.json({}))
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
        
}

function ChangeDriverStatus(req, res, next) {
    userService.ChangeDriverStatus(req)
        // .then(() => res.json({}))
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
        
}



function soft_delete(req, res, next) {
    userService.soft_delete(req.params.id)
        // .then(() => res.json({}))
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function permanent_delete(req, res, next) {
    userService.permanent_delete(req.params.id)
        // .then(() => res.json({}))
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

async function documentsUpload (req, res) {
    console.log(req.body)
    try {
        const { name, userId } = req.body;
        if((userId) && (userId !== "") && (name) && (name !== "")){
            if(req.files){
                const allowType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
                if(req.files.document_file){
                    const uploadedFile = req.files.document_file;
                    const uploadResult = await fileUpload(uploadedFile,name + userId.substr(userId.length - 4),allowType);
                    if((uploadResult) && (uploadResult !== "")){
                        fs.readFile(uploadedFile.tempFilePath, (err, uploadedData) => {
                            const params = {
                                Bucket: process.env.BUCKET_NAME,
                                Key: "images/"+ uploadResult, // File name you want to save as in S3
                                Body: uploadedData 
                            };
                            s3.upload(params, async (err, data) => {
                                if (err) {
                                    return res.status(203).json({ status:'error', error: "Sorry! File upload failed." + err.message });
                                }else{
                                    const uploadData = await Driver.findByIdAndUpdate(userId,{$push:{documents:{name:name, filename:data.Key}}}, {new: true});
                                    for(let i=0; i < uploadData.documents.length; i++){
                                        uploadData.documents[i].filename = await getSignedUrl(uploadData.documents[i].filename);
                                    }
                                    return res.status(200).json({ status: 'success', data: uploadData });
                                }
                            });
                        });
                    }else{
                        return res.status(203).json({ status:'error', error: "Sorry! Invalid File or File is not correct." });
                    }
                }
            } else {
                return res.status(203).json({ status:'error', error: "Sorry! Please upload a file." });
            }
        }else{
            return res.status(203).json({ status:'error', error: "Sorry! Parameter misssing." });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ status:'error', error: error.message });
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
            Key: keyName  //"images/logo.jpg", 
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
        const uploadedFile = requestFile;
        if(allowType.includes(uploadedFile.mimetype)) {
            let uploadedFileName = uploadedFile.name;
            const filenameSplit = uploadedFileName.split('.');
            const fileExtension = filenameSplit[filenameSplit.length-1];
            uploadedFileName = fileName.toLowerCase().replace(" ", "-") +'-'+ Date.now()+ '.' + fileExtension;
            // await uploadedFile.mv(destination + uploadedFileName);
            return uploadedFileName;
        }else{
            throw new Error('Sorry! Invalid File.')
            // throw {status: 'error', message: 'Sorry! Invalid File.'};
        }
    } catch (error) {
        throw new Error(error)
    }
    
}

async function removeDocument (req, res) {
    try {
        const { docId, userId, imageName } = req.body;
        if((docId) && (docId !== "") && (userId) && (userId !== "") && (imageName) && (imageName !== "")){
            const fileLocation = 'images/'+imageName;
            s3.deleteObject({
                Bucket: process.env.BUCKET_NAME,
                Key: fileLocation
            },async (err,data) => {
                if(err) {
                    return res.status(203).json({ status:'error', error: err.message });
                }else{
                    const removeData = await Driver.findByIdAndUpdate(userId,{$pull:{documents:{_id: docId}}}, {new: true});
                    if(removeData){
                        return res.status(200).json({ status: 'success' });
                    }else{
                        return res.status(203).json({ status:'error', error: "Sorry! Something went wrong." });
                    }
                }
            });
        }else{
            return res.status(203).json({ status:'error', error: "Sorry! Parameter misssing." });
        }
    } catch (error) {
        res.status(400).json({ status:'error', error: error.message });
    }
}

async function updateDocument (req, res) {
    try {
        const { docId, userId } = req.body;
        const drivers = await Driver.findOne({_id: userId}, {"documents": 1});
        // console.log(users.documents.length);
        for(let i=0; i<drivers.documents.length; i++){
            if(drivers.documents[i]._id == docId){
                if((req.files) && (req.files.document_file)){
                    const uploadedFile = req.files.document_file;
                    const allowType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
                    const uploadResult = await fileUpload(uploadedFile,drivers.documents[i].name + userId.substr(userId.length - 4),allowType);
                    // console.log(uploadResult);
                    if((uploadResult) && (uploadResult !== "")){
                        fs.readFile(uploadedFile.tempFilePath, (err, uploadedData) => {
                            // const fileContent  = Buffer.from(req.files.document_file.data, 'binary');
                            const params = {
                                Bucket: process.env.BUCKET_NAME,
                                Key: "images/"+ uploadResult, // File name you want to save as in S3
                                Body: uploadedData 
                            };
                            s3.upload(params, async (err, data) => {
                                if (err) {
                                    return res.status(203).json({ status:'error', error: "Sorry! File upload failed." + err.message });
                                }else{
                                    // console.log(data.Key)
                                    const updateData = await Driver.updateOne({"_id":userId, "documents._id": docId},{$set:{'documents.$.filename':data.Key}}, {new: true});
                                    // console.log(updateData);
                                    if(updateData){
                                        //// Delete Old File //////
                                        const oldFile = drivers.documents[i].filename;
                                        s3.deleteObject({
                                            Bucket: process.env.BUCKET_NAME,
                                            Key: oldFile
                                        },function (err,data){});
                                        return res.status(200).json({ status: 'success' });
                                    }else{
                                        return res.status(203).json({ status:'error', error: "Sorry! Update Failed." });
                                    }

                                    
                                }
                            });
                        })
                    }else{
                        return res.status(203).json({ status:'error', error: "Sorry! File upload failed." });
                    }
                } else {
                    return res.status(203).json({ status:'error', error: "Sorry! Please upload a file." });
                }
            }
        }
    } catch (error) {
        res.status(400).json({ status:'error', error: error.message });
    }
    
}