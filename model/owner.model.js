const mongoose = require('mongoose');
const moment = require('moment');

const owner = mongoose.Schema(
    {
        name: String,
        email: String,
        phone: String,
        password: String,
        countryCode:String,      
        city: String,
        referalCode: String,
        profilePic: String,
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
        cars: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],        
        status: {
            type: String,
            enum : ['P','A','B','R'],  // P = Pending, A = Active, B = Block, R = Reject
            default: 'P'
        },
        signUpDate: {
            type:Date,
            default:Date.now
        },
        createdAt: { 
            type: Date,
            default: Date.now
        },
        updatedAt: { 
            type: Date,
            default: Date.now
        },
    },
    { versionKey: false }
);
owner.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});
module.exports = mongoose.model('rido_owner', owner);
