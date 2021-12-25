const mongoose = require('mongoose');
const moment = require('moment');

const drivers = mongoose.Schema(
    {
        name: String,
        email: String,
        countryCode: String,
        phone: String,
        password: String,
        city: String,
        referalCode: String,
        profilePic: String,  
        owner:{ type: mongoose.Schema.Types.ObjectId, ref: "rido_owner" },      
        car: { type: mongoose.Schema.Types.ObjectId, ref: "Car" },
        documents: [{
            name: String,
            filename: String,
            documentName:String,            
            verifyStatus: {
                // type: String,
                // enum : ['Y','N'],
                // default: 'N',
                type: Boolean,
                default:false
            },
            createdAt: { 
                type: Date,
                default: Date.now
            },
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }],
        refreshToken: String,
        status: {
            type: String,
            enum : ['P','A','B','R'],  // P = Pending, A = Active, B = Block, R = Reject
            default: 'P'
        },
        signupDate: { 
            type: Date,
            default: Date.now
        },        
        createdAt: { 
            type: Date,
            default: Date.now
        },
        updatedAt: { 
            type: Date,
            default: Date.now
        },
        is_delete:{
            type:Boolean,
            default:false,
        }
    },
    { versionKey: false }
);

// drivers.index({username: "text"});

// Virtual for user name and age
// drivers.virtual('name_age').get(function () {
//     return this.name + ', ' + this.phone;
// });

// Virtual for date generation
drivers.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model('rido_driver', drivers);
