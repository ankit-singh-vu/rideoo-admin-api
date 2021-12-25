const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const User = db.Car;

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

// async function getAll() {
//     return await User.find().populate("owner", "name").populate("carModelID", "name").populate("driver", "name").populate("carCategory", "name");
// }

function getFilters(req) {
    let filter={}
    // console.log(req.query)

    if(req.query.is_delete) filter.is_delete=req.query.is_delete;
    
    if(req.query.vehicleNo) filter.vehicleNo={$regex:req.query.vehicleNo,$options: 'i'};    
    if(req.query.carModel) filter.carModel={$regex:req.query.carModel,$options: 'i'};    
    if(req.query.phoneNo) filter.phoneNo={$regex:req.query.phoneNo,$options: 'i'};    
    if(req.query.status) filter.status=req.query.status;    

    if(req.query.owner) filter.owner={$regex:req.query.owner,$options: 'i'};         
    if(req.query.carCategory) filter.carCategory={$regex:req.query.carCategory,$options: 'i'};         

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
    let car= await User.find(f.filter,null, {sort: {createdAt: f.order}})
    // let car= await User.find()
    // .select("vehicleNo status")
    .populate("carModelID", "name")
    .populate("driverId", "name")
    .lean();

    if(car){
        for (let i = 0; i < car.length; i++) {
            car[i].driverId = (car[i].driverId) ? car[i].driverId : null;
            car[i].carModelID = (car[i].carModelID) ? car[i].carModelID : null;
        }
    }
    return car;
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

    // if (await User.findOne({ phoneNo: userParam.phoneNo })) {
    //     throw 'phoneNo "' + userParam.phoneNo + '" is already registered';
    // }    
    
    if (await User.findOne({ vehicleNo: userParam.vehicleNo })) {
        throw 'vehicleNo "' + userParam.vehicleNo + '" is already registered';
    }
    const user = new User(userParam);
    // save user
    return await user.save();
}

async function update(id, userParam) {
    let user = await User.findById(id);

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
    console.log(user)
    await user.save();
}

async function _delete(id) {
    await User.findByIdAndRemove(id);
}