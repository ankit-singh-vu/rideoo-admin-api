const mongoose = require('mongoose');
const moment = require('moment');
const car = mongoose.Schema(
    {
        carModel: String,
        carModelID: { type: mongoose.Schema.Types.ObjectId, ref: "Car_model"},
        vehicleNo: String,
        phoneNo: String,
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "rido_owner" }, 

        carCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Car_category"},

        profileImage: String,
        
        carImage: String,

        insuranceDoc: String,
        verifyInsuranceDoc:{
            type:Boolean,
            default:false,
        }  ,    
        rcDoc: String,
        verifyRcDoc:{
            type:Boolean,
            default:false,
        },  
        permitDoc: String,
        verifyPermitDoc:{
            type:Boolean,
            default:false,
        },
        fitnessDoc: String,
        verifyFitnessDoc:{
            type:Boolean,
            default:false,
        },
        pollution: { type: String, required: true },
        taxToken: { type: String, required: true },
        verifyPollution:{
            type:Boolean,
            default:false,
        },
        verifyTaxToken:{
            type:Boolean,
            default:false,
        },             
        driverId: { type: mongoose.Schema.Types.ObjectId, ref: "rido_driver" }, 
        status: {
            type: Number,
            enum : [0,1],
            default: 1
        },
        is_delete:{
            type:Boolean,
            default:false,
        }

    },
    {timestamps:true}
);



module.exports = mongoose.model('car', car);
