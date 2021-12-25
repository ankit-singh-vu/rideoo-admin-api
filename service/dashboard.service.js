const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const User = db.User;

module.exports = {
    authenticate,
    getAll,
    bookings,
    driverLocation,
    bookingsTransaction,
    getById,
    create,
    update,
    delete: _delete,
    search_by_email: search_by_email
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

async function get_earnings(d) {
    //total
    let total_earning= 0;
    let results=await db.BookingTransaction.find({payStatus:1}).select("amount");
    let sum=0;
    for (let i = 0; i < results.length; i++) {
    sum += parseFloat(results[i].amount);
    }
    total_earning=sum;

    //last month
    let diff_earning= 0,diff_percent=0;
    let results_last_month=await db.BookingTransaction.find({payStatus:1,createdAt:{$gte:d}}).select("amount");
    sum=0;
    for (let i = 0; i < results_last_month.length; i++) {
    sum += parseFloat(results_last_month[i].amount);
    }
    diff_earning=sum;

    diff_percent=(diff_earning/total_earning*100).toFixed(1);

    let return_data={
            total_earning,
            diff_earning,
            diff_percent,
    }
    return return_data;
}



async function getAll(req) {
    let driver={},rider={},rideBooking={},earnings={};
    let days=31;
    if(req.query.days) days=req.query.days;
    var d =new Date((new Date().getTime() - (days * 24 * 60 * 60 * 1000)))

    rideBooking.total_count=await db.RideBooking.find().count();
    driver.total_count=await db.Driver.find().count();
    rider.total_count=await db.Rider.find().count();

    rideBooking.diff_count=await db.RideBooking.find({createdAt:{$gte:d}}).count();
    driver.diff_count=await db.Driver.find({createdAt:{$gte:d}}).count();
    rider.diff_count=await db.Rider.find({createdAt:{$gte:d}}).count();
    
    driver.diff_percent=(driver.diff_count/driver.total_count*100).toFixed(1);
    rider.diff_percent=(rider.diff_count/rider.total_count*100).toFixed(1);
    rideBooking.diff_percent=(rideBooking.diff_count/rideBooking.total_count*100).toFixed(1);
    completed_ride=await db.RideBooking.find({rideStatus:5}).count();
    cancelled_ride=await db.RideBooking.find({rideStatus:2}).count();    

    earnings = await get_earnings(d)
    // console.log(earnings)
    let return_data={
        driver:driver,
        rider:rider,
        rideBooking:rideBooking,
        earnings:earnings,
        completed_ride:completed_ride,
        cancelled_ride:cancelled_ride,
    }
    return return_data;
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

async function bookings(req) {
    let f=getFilters(req)
    // console.log(f.filter)

    let results = await db.RideBooking.find(f.filter,null, {sort: {createdAt: f.order}})
    .populate("rider","name")
    .populate("driver","name")
    // .select("-refreshToken -password -documents").lean();


    let return_data={
        total:results.length,
        results:results,
    }
    return return_data;
}

async function driverLocation(req) {
    let f=getFilters(req)
    // console.log(f.filter)

    let results=await db.DriverLocation.find(f.filter,null, {sort: {createdAt: f.order}})
    .populate("driverId","-documents")
    let return_data={
        total:results.length,
        results:results,
    }
    return return_data;
}

async function bookingsTransaction(req) {
    let f=getFilters(req)
    // console.log(f.filter)

    let results=await db.BookingTransaction.find(f.filter,null, {sort: {createdAt: f.order}})
    // .select("-refreshToken -password -documents").lean();

    let return_data={
        total:results.length,
        results:results,
    }
    return return_data;
}

async function getById(id) {
    return await User.findById(id);
}

async function search_by_email(userParam) {
    let val;
    console.log(userParam)
    for(var i in userParam){
        val=userParam[i];
    }
    let q;
    //name and email
    // q={ $or: [{ 'name': { $regex:  val, $options: 'i'} }, { 'email': { $regex:  val, $options: 'i'} }] };
    //name 
    q={email:  {$regex:val,$options: 'i'}};
    return await User.find(q);
}

async function create(userParam) {
    // validate
    if (await User.findOne({ email: userParam.email })) {
        throw 'email "' + userParam.email + '" is already taken';
    }

    const user = new User(userParam);

    // hash password
    if (userParam.password) {
        user.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // save user
    await user.save();
}

async function update(id, userParam) {
    const user = await User.findById(id);

    // validate
    if (!user) throw 'User not found';
    if (user.email !== userParam.email && await User.findOne({ email: userParam.email })) {
        throw 'email "' + userParam.email + '" is already taken';
    }

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);

    await user.save();
}

async function _delete(id) {
    await User.findByIdAndRemove(id);
}