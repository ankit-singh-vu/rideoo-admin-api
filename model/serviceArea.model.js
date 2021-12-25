const mongoose = require('mongoose');
const moment = require('moment');

const serviceArea = mongoose.Schema(
    {
        addressLocation: { type: String },
        latitude: { type: String },
        longitude: { type: String },
        radius: { type: Number },
        status: { type: Boolean, default: true }
    },
    { timestamps:true },
    { versionKey: false }
);

// Virtual for date generation
serviceArea.virtual('createdOn').get(function () {
    const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

// Virtual for date generation
serviceArea.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model('service_area', serviceArea);