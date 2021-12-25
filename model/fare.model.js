const mongoose = require('mongoose');
const moment = require('moment');

const fare = mongoose.Schema(
    {
        carCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Car_category"},
        base_fare: { type: Number },       
        per_km_fare: { type: Number },
        per_min_fare: { type: Number },
        waiting_fare: { type: Number },
        waiting_per_min_fare: { type: Number },
        base_km: { type: Number }, 
        cancellation_charge: { type: Number }, 
        commision_percentage:  { type: Number },  
        vehicle_wheels: {
            type: String,
            enum : ['two','four'],
            default: 'four'
        },

    },
    { timestamps:true }
);

// Virtual for date generation
fare.virtual('createdOn').get(function () {
    const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

// Virtual for date generation
fare.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model('fare', fare);