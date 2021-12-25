const mongoose = require('mongoose');
const moment = require('moment');

const carCategory = mongoose.Schema(
    {
        // _id: mongoose.Schema.Types.ObjectId,
        name: String,
        image: String,
        cars: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car"}],
        status: {
            type: Number,
            enum : [0,1],
            default: 1
        }
    },
    { timestamps:true }
);

// Virtual for date generation
carCategory.virtual('createdOn').get(function () {
    const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

// Virtual for date generation
carCategory.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model('Car_category', carCategory);