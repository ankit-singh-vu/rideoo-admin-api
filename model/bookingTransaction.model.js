const mongoose = require('mongoose');
const moment = require('moment');

const bookingTransaction = mongoose.Schema(
    {
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "ride_booking"},
        rider: { type: mongoose.Schema.Types.ObjectId, ref: "rido_riders" },
        transactionId: { type: String },
        amount: { type: String },
        rideDistance: { type: String },
        rideTime: { type: String },
        paymentMethod: { type: Number, enum: [1,2,3], default: 1}, // 1 = CASH || 2 = Online || 3 = Wallet
        payStatus: { type: Number, enum: [0,1,2,3], default: 0},  // 0 = Pending || 1 = Success || 2 = Failed || 3 = Cancelled,
        paymentResponse: {type: String, default: ""},
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
bookingTransaction.virtual('createdOn').get(function () {
    const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

// Virtual for date generation
bookingTransaction.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model('booking_transaction', bookingTransaction);