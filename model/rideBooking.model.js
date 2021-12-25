const mongoose = require('mongoose');
const moment = require('moment');

const rideBooking = mongoose.Schema(
    {
        genId: { type: String},
        carCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Car_category"},
        cars: { type: mongoose.Schema.Types.ObjectId, ref: "Car", default: null},
        rider: { type: mongoose.Schema.Types.ObjectId, ref: "rido_riders" },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "rido_owner", default: null },
        driver: { type: mongoose.Schema.Types.ObjectId, ref: "rido_driver", default: null },
        driverRejection: [{
            driver: { type: mongoose.Schema.Types.ObjectId, ref: "rido_drivers"},
            owner: { type: mongoose.Schema.Types.ObjectId, ref: "rido_owner" },
            reasons: String,
            rejectAt: { type: Date, default: Date.now }
        }],
        pickUp: String,
        drop: String,
        // pickUpLat: String,
        // pickUpLang: String,
        // dropLat: String,
        // dropLang: String,
        pickupLocation: { type: { type: String }, coordinates: [] },
        dropLocation: { type: { type: String }, coordinates: [] },
        estimateDistance: String,
        actualTakenDistance: { type: String, default: "" },
        estimateTime: String,
        actualTakenTime: { type: String, default: "" },
        estimateFare: String,
        finalFare: { type: String, default: "" },
        rideDiscount: { type: Number, default: "" },
        findDriver: { type: String, enum: ["Y","N"],  default: "N" },
        driverArrived: {type: String, default: "" },
        rideStatus: { type: Number,  enum: [0,1,2,3,4,5], default: 0 }, // 0 = Pending || 1 = Notified Driver || 2 = Cancelled by Rider || 3 = Driver Accepted || 4 = Ride Ongoing || 5 = Ride Completed
        bookingDateTime: String,
        rideStartTime: { type: String, default: "" },
        rideEndTime: { type: String, default: "" },
        rideOtp: { String, default: "" },
        riderNotified: { type: String, enum: ["Y","N"],  default: "N" },
        cancelReason: { type: String, default: "" },
        paymentMethod: { type: Number, enum: [1,2,3], default: 1}, // 1 = CASH || 2 = Online || 3 = Wallet
        payStatus: { type: Number, enum: [0,1,2,3], default: 0},  // 0 = Pending || 1 = Success || 2 = Failed || 3 = Cancelled
        is_deleted: {
            type: Number,
            enum : [0,1],
            default: 0
        }
    },
    { timestamps:true },
    { versionKey: false }
);

// Virtual for date generation
rideBooking.virtual('createdOn').get(function () {
    const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

// Virtual for date generation
rideBooking.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model('ride_booking', rideBooking);