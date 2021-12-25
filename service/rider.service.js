const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const User = db.Rider;

module.exports = {
    authenticate,
    getAll,
    getById,
    search: search,
    create,
    update,
    delete: _delete,
    soft_delete,
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

function getFilters(req) {
    let filter={}
    // console.log(req.query)

    if(req.query.is_delete) filter.is_delete=req.query.is_delete;
    
    if(req.query.name) filter.name={$regex:req.query.name,$options: 'i'};    
    if(req.query.email) filter.email={$regex:req.query.email,$options: 'i'};    
    if(req.query.phone) filter.phone={$regex:req.query.phone,$options: 'i'};    
    if(req.query.status) filter.status={$regex:req.query.status,$options: 'i'};    
    if(req.query.referalCode) filter.referalCode={$regex:req.query.referalCode,$options: 'i'};      

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
    return await User.find(f.filter,null, {sort: {createdAt: f.order}}).select("-refreshToken -password");
}

async function getById(id) {
    return await User.findById(id).select("-refreshToken -password");
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
    return await User.findByIdAndRemove(id);
}


async function soft_delete(id) {
    let rider = null
    rider = await User.findById(id)
    if(rider){
        rider.is_delete=true
        rider = await rider.save();
    }
    return rider
}