const mongoose = require('mongoose');
const moment = require('moment');

const schema = mongoose.Schema(
    {
        carCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Car_category"},
        name: { type: String },       
    },
    { timestamps:true }
);

// Virtual for date generation
schema.virtual('createdOn').get(function () {
    const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

// Virtual for date generation
schema.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model('Car_model', schema);