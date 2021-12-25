const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const AWS = require('aws-sdk');
const fs = require('fs');

const Driver = db.Driver;
const Car = db.Car;
const Owner = db.Owner;
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
    forEdit,
    soft_delete,
    permanent_delete,
    driverApproveDocument,
    driverRejectDocument,
    ChangeDocumentStatus,
    ChangeDocumentStatusCar,
    ChangeDriverStatus,
    bookings,
    location,
    stats
};

async function authenticate({ email, password }) {
    const user = await Driver.findOne({ email });
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

    // if(req.query.name) filter.name=req.query.name;
    // if(req.query.email) filter.email=req.query.email;
    // if(req.query.phone) filter.phone=req.query.phone;
    // if(req.query.status) filter.status=req.query.status;
    if(req.query.is_delete) filter.is_delete=req.query.is_delete;

    
    if(req.query.name) filter.name={$regex:req.query.name,$options: 'i'};    
    if(req.query.email) filter.email={$regex:req.query.email,$options: 'i'};    
    if(req.query.phone) filter.phone={$regex:req.query.phone,$options: 'i'};    
    if(req.query.status) filter.status={$regex:req.query.status,$options: 'i'};    
    if(req.query.city) filter.city={$regex:req.query.city,$options: 'i'};      

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
    // console.log(f.filter)

    let user=await Driver.find(f.filter,null, {sort: {createdAt: f.order}}).select("-refreshToken -password -documents").lean();

    if(user){
        for(let u=0; u < user.length; u++){
            // user[u].cars_count=(user[u].cars)?user[u].cars.length : 0;
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

async function bookings(req) {
    // let f=getFilters(req)
    let filter={}

    console.log(req)
    // if(req.params.id) filter.name={$regex:req.params.id,$options: 'i'};    

    
    let results=await db.RideBooking.find({driver:req.params.id},null, {sort: {createdAt: -1}}).populate("rider","name")


    // let results=await db.RideBooking.find(f.filter,null, {sort: {createdAt: f.order}})
    // .select("-refreshToken -password -documents").lean();


    let return_data={
        total:results.length,
        results:results,
    }
    return return_data;
}

async function getById(id) {
    // return await Driver.findById();
    let user=await Driver.findById(id).select("-refreshToken -password");
    if(user.documents){
        for(let i=0; i < user.documents.length; i++){
            user.documents[i].filename = await getSignedUrl(user.documents[i].filename);
        }
    }

    if(user.profilePic){
        user.profilePic = await getSignedUrl(user.profilePic);
    }
    return user;
}

async function location(req) {
    return await db.DriverLocation.findOne({driverId:req.params.id});
}

    //   var fare =await db.BookingTransaction.aggregate([
    //     { $match: {
    //         amount: { $exists: true },
    //         payStatus:2
    //     }},
    //     { $addFields: {
    //         amount_double: { $toDouble: "$amount" }
    //     }},
    //     { $group:
    //         { _id : null, sum : { $sum: "$amount_double" } }
    //     }
    // ])
    // // console.log(fare[0].sum)
    // let total_earning= (fare[0].sum)?fare[0].sum:0;

async function stats(req) {
    let id=req.param.id
    let driver={},rider={},rideBooking={};
    let days=31;
    if(req.query.days) days=req.query.days;
    var d =new Date((new Date().getTime() - (days * 24 * 60 * 60 * 1000)))

    completed_ride=await db.RideBooking.find({driver:id,rideStatus:5}).count();
    cancelled_ride=await db.RideBooking.find({driver:id,rideStatus:2}).count();

    //total
    let total_earning= 0;
    let results=await db.RideBooking.find({driver:id,payStatus:1}).select("estimateFare");
    let sum=0;
    for (let i = 0; i < results.length; i++) {
    sum += parseFloat(results[i].estimateFare);
    }
    total_earning=sum;

    //last month
    let diff_earning= 0,diff_percent=0;
    let results_last_month=await db.RideBooking.find({driver:id,payStatus:1,createdAt:{$gte:d}}).select("estimateFare");
    sum=0;
    for (let i = 0; i < results_last_month.length; i++) {
    sum += parseFloat(results_last_month[i].estimateFare);
    }
    diff_earning=sum;
    if(diff_earning ==0 && total_earning==0) diff_percent=0
    else diff_percent=(diff_earning/total_earning*100).toFixed(1);


    let return_data={
        completed_ride:completed_ride,
        cancelled_ride:cancelled_ride,
        earning:{
            total_earning,
            diff_earning,
            diff_percent,
        }
    }

    return return_data;
}



async function forEdit(id) {

    let driver=null;
    let owner=null;
    let car=null;

    // let driver={};
    // let owner={};
    // let car={};
    //---driver
        driver=await Driver.findById(id).select("-refreshToken -password -createdAt -updatedAt -type -cars")
        if(driver)
        {
            if(driver.documents){
                for(let i=0; i < driver.documents.length; i++){
                    driver.documents[i].filename = await getSignedUrl(driver.documents[i].filename);
                }
            }
            if(driver.profilePic){
                driver.profilePic = await getSignedUrl(driver.profilePic);
            }
        }

        
    //---car
        if(driver){
            car=await Car.findOne({"driverId":driver._id})
            .select("-createdAt -updatedAt  -driver")
            .populate("carModelID", "name")
            .populate("carCategory", "name")

            if(car)
            {
                if(car.carImage) car.carImage = await getSignedUrl(car.carImage);
                if(car.insuranceDoc) car.insuranceDoc = await getSignedUrl(car.insuranceDoc);
                if(car.rcDoc) car.rcDoc = await getSignedUrl(car.rcDoc);
                if(car.permitDoc) car.permitDoc = await getSignedUrl(car.permitDoc);
                if(car.fitnessDoc) car.fitnessDoc = await getSignedUrl(car.fitnessDoc);
                if(car.pollution) car.pollution = await getSignedUrl(car.pollution);
                if(car.taxToken) car.taxToken = await getSignedUrl(car.taxToken);
            }
        }

    //---owner
        if(car){
            owner=await Owner.findOne({"_id":car.owner}).select("-createdAt -updatedAt -owner -driver")
            if(owner){
                if(owner.documents){
                    for(let i=0; i < owner.documents.length; i++){
                        owner.documents[i].filename = await getSignedUrl(owner.documents[i].filename);
                    }
                }
                if(owner.profilePic){
                    owner.profilePic = await getSignedUrl(owner.profilePic);
                }
            }
        }


    let return_data={
        owner:owner,
        driver:driver,
        car:car
    }
    return return_data;
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
    return await Driver.find(q);
}

async function create(req) {
    // console.log("hi")

    let userParam=req.body;
    // console.log(req.files)
    // validate
    if (await Driver.findOne({ email: userParam.email })) {
        throw 'email "' + userParam.email + '" is already taken';
    }

    let user = new Driver(userParam);

    // // hash password
    if (userParam.password) {
        user.password = bcrypt.hashSync(userParam.password, 10);
    }

    if(req.files){
        // console.log(req.files)
        // console.log(req.files.profileImage)
        const allowType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        if(req.files.profileImage){
            const uploadedFile = req.files.profileImage;
            const  filename = await fileUpload(uploadedFile,"Profile Photo",allowType);
            const obj=add_doc("Profile Photo", filename)
            user.documents.push(obj);
        }
        if(req.files.driving_license_front){
            const uploadedFile = req.files.driving_license_front;
            const  filename= await fileUpload(uploadedFile,"driving_license_front",allowType);
            const obj=add_doc("Driving Licence (Front)", filename)
            user.documents.push(obj);
        }
        if(req.files.driving_license_back){
            const uploadedFile = req.files.driving_license_back;
            const  filename= await fileUpload(uploadedFile,"driving_license_back",allowType);
            const obj=add_doc("Driving Licence (Back)", filename)
            user.documents.push(obj);
        }

    }



    let profileImage ="", carImage = "", insuranceDoc = "", rcDoc = "", permitDoc = "", fitnessDoc = "",pollution="",taxToken="";
    if(req.files){
        const allowType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        // if(req.files.profileImage){
        //     const uploadedFile = req.files.profileImage;
        //     profileImage = await fileUpload(uploadedFile,"Profile Photo",allowType);
        // }
        if(req.files.carImage){
            const uploadedFile = req.files.carImage;
            carImage = await fileUpload(uploadedFile,"Car Photo",allowType);
        }
        if(req.files.insuranceDoc){
            const uploadedFile = req.files.insuranceDoc;
            insuranceDoc = await fileUpload(uploadedFile,"Insurance Paper",allowType);
        }
        if(req.files.rcDoc){
            const uploadedFile = req.files.rcDoc;
            rcDoc = await fileUpload(uploadedFile,"RC Paper",allowType);
        }
        if(req.files.permitDoc){
            const uploadedFile = req.files.permitDoc;
            permitDoc = await fileUpload(uploadedFile,"Permit Paper",allowType);
        }
        if(req.files.fitnessDoc){
            const uploadedFile = req.files.fitnessDoc;
            fitnessDoc = await fileUpload(uploadedFile,"Fitness Paper",allowType);
        }


        if(req.files.pollution){
            const uploadedFile = req.files.pollution;
            pollution = await fileUpload(uploadedFile,"Pollution",allowType);
        }
        else
        throw 'Pollution  Paper  not Uploaded';

        if(req.files.taxToken){
            const uploadedFile = req.files.taxToken;
            taxToken = await fileUpload(uploadedFile,"Tax Token",allowType);
        }
        else
        throw 'Tax Token Paper not Uploaded';
    }

    user = await user.save();
    let car = new Car(userParam);
    car.driverId=user.id;

    car.carImage=carImage;
    car.insuranceDoc=insuranceDoc;
    car.rcDoc=rcDoc;
    car.permitDoc=permitDoc;
    car.fitnessDoc=fitnessDoc;
    car.pollution=pollution;
    car.taxToken=taxToken;
    car = await car.save();
    // return car;
    return {};
}

// async function create(req) {

//     let userParam=req.body;
//     // console.log(userParam)
//     // validate
//     if (await Driver.findOne({ email: userParam.email })) {
//         throw 'email "' + userParam.email + '" is already taken';
//     }

//     let user = new Driver(userParam);

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
//         // if(req.files.adhar_front){
//         //     const uploadedFile = req.files.adhar_front;
//         //     adhar_front = await fileUpload(uploadedFile,"adhar front",allowType);
//         //     const obj={
//         //         name: "adhar front",
//         //         filename: adhar_front
//         //     }
//         //     user.documents.push(obj);
//         // }
//         // if(req.files.adhar_back){
//         //     const uploadedFile = req.files.adhar_back;
//         //     adhar_back = await fileUpload(uploadedFile,"adhar back",allowType);
//         //     const obj={
//         //         name: "adhar back",
//         //         filename: adhar_back
//         //     }
//         //     user.documents.push(obj);
//         // }

//         if(req.files.adhar_card_front){
//             const uploadedFile = req.files.adhar_card_front;
//             const  filename= await fileUpload(uploadedFile,"adhar_card_front",allowType);
//             const obj=add_doc("adhar_card_front", filename)
//             user.documents.push(obj);
//         }
//         if(req.files.adhar_card_back){
//             const uploadedFile = req.files.adhar_card_back;
//             const  filename= await fileUpload(uploadedFile,"adhar_card_back",allowType);
//             const obj=add_doc("adhar_card_back", filename)
//             user.documents.push(obj);
//         }
//         if(req.files.policy_clearance_certificate){
//             const uploadedFile = req.files.policy_clearance_certificate;
//             const  filename= await fileUpload(uploadedFile,"policy_clearance_certificate",allowType);
//             const obj=add_doc("policy_clearance_certificate", filename)
//             user.documents.push(obj);
//         }



//         if(req.files.pan_card){
//             const uploadedFile = req.files.pan_card;
//             const  filename= await fileUpload(uploadedFile,"pan_card",allowType);
//             const obj=add_doc("pan_card", filename)
//             user.documents.push(obj);
//         }
//         if(req.files.voter_card){
//             const uploadedFile = req.files.voter_card;
//             const  filename= await fileUpload(uploadedFile,"voter_card",allowType);
//             const obj=add_doc("voter_card", filename)
//             user.documents.push(obj);
//         }
//         if(req.files.legal_agreement){
//             const uploadedFile = req.files.legal_agreement;
//             const  filename= await fileUpload(uploadedFile,"legal_agreement",allowType);
//             const obj=add_doc("legal_agreement", filename)
//             user.documents.push(obj);
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
//         if(req.files.bank_passbook){
//             const uploadedFile = req.files.bank_passbook;
//             const  filename= await fileUpload(uploadedFile,"bank_passbook",allowType);
//             const obj=add_doc("bank_passbook", filename)
//             user.documents.push(obj);
//         }

//     }

//     // console.log(user);
//     // save user
//     // return user;
//     // return await user.save();
//     user = await user.save();
//     user = await Driver.findById(user.id).select("-refreshToken -password");
//     if(user.documents){
//         for(let i=0; i < user.documents.length; i++){
//             user.documents[i].filename = await getSignedUrl(user.documents[i].filename);
//         }
//     }
//     if(user.profilePic){
//         user.profilePic = await getSignedUrl(user.profilePic);
//     }

    
//     return {};



// }

function add_doc(name, filename) {
    const obj={
        name: name,
        filename: filename
    } 
    return obj;
}

// async function update(id, userParam) {
//     let user = await Driver.findById(id);

//     // validate
//     if (!user) throw 'Driver not found';
//     if (user.email !== userParam.email && await Driver.findOne({ email: userParam.email })) {
//         throw 'email "' + userParam.email + '" is already taken';
//     }

//     // hash password if it was entered
//     if (userParam.password) {
//         userParam.hash = bcrypt.hashSync(userParam.password, 10);
//     }

//     // copy userParam properties to user
//     Object.assign(user, userParam);
//     console.log(user)
//     return await user.save();
// }

async function update(id, userParam) {
    let user = await Driver.findById(id);

    // validate
    if (!user) throw 'Driver not found';
    if(userParam.email){
        if (user.email !== userParam.email && await Driver.findOne({ email: userParam.email })) {
            throw 'email "' + userParam.email + '" is already taken';
        }
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


async function driverApproveDocument(req) {
    // console.log(req.query)
    let user = await Driver.findById(req.query.id);
    for (let i = 0; i < user.documents.length; i++) {
        if(user.documents[i]._id==req.query.doc_id)  
        {
            // console.log(user.documents[i]._id )  
            user.documents[i].verifyStatus="Y";
        }
    }
    await user.save();
    return {}
}

async function driverRejectDocument(req) {
    let user = await Driver.findById(req.query.id);
    for (let i = 0; i < user.documents.length; i++) {
        if(user.documents[i]._id==req.query.doc_id)  
        {
            user.documents[i].verifyStatus="N";
        }
    }
    await user.save();
    return {}
}

async function ChangeDocumentStatus(req) {
    console.log(req.query)

    let user;
    if(req.query.type=='driver')
        user = await Driver.findById(req.query.id);
    else if(req.query.type=='owner')
        user = await Owner.findById(req.query.id);

        console.log(user)
    for (let i = 0; i < user.documents.length; i++) {
        if(user.documents[i]._id==req.query.doc_id)  
        {
            console.log(user.documents[i]._id )  
            user.documents[i].verifyStatus=req.query.status;
        }
    }
    return await user.save();
    // return {}
}

async function ChangeDocumentStatusCar(req) {
    console.log(req.query)
    let user;
    user = await Car.findOne({_id:req.query.car_id});
        console.log(user)

    if(req.query.doc_name=='insuranceDoc')
        user.verifyInsuranceDoc=req.query.status;

    if(req.query.doc_name=='rcDoc')
        user.verifyRcDoc=req.query.status;        

    if(req.query.doc_name=='permitDoc')
        user.verifyPermitDoc=req.query.status;
        
    if(req.query.doc_name=='fitnessDoc')
        user.verifyFitnessDoc=req.query.status;  

    if(req.query.doc_name=='pollution')
        user.verifyPollution=req.query.status;
        
    if(req.query.doc_name=='taxToken')
        user.verifyTaxToken=req.query.status;  

    return await user.save();
}

async function ChangeDriverStatus(req) {
    let driver;
    driver = await Driver.findById(req.query.id);
    // console.log(driver)
    driver.status=req.query.status;
    return await driver.save();
    // driver = await Driver.updateOne({_id: req.query.id}, {$set:{status:req.query.status}})
    // return await driver;
}

async function soft_delete(id) {
    // driver = await Driver.updateOne({_id: id}, {$set:{is_delete:true}})
    // car = await Car.updateOne({_id: car._id}, {$set:{is_delete:true}})
    let car=null
    let driver=null

    car = await Car.findOne({driver:id})
    if(car){
        car.is_delete=true
        car = await car.save();
    }

    driver = await Driver.findById(id)
    driver.is_delete=true    
    driver = await driver.save();

    let return_data={
        car: car,
        driver: driver
    } 

    // let return_data={
    //     car:{
    //         _id:car._id,
    //         is_delete:car.is_delete
    //     },
    //     driver:{
    //         _id:driver._id,
    //         is_delete:driver.is_delete
    //     }
    // } 
    return return_data
}

async function permanent_delete(id) {
        var car = await Car.deleteOne({driver:id});
        var driver = await Driver.deleteOne({_id:id});
        let return_data={
            car: car,
            driver: driver
        } 
        return return_data
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