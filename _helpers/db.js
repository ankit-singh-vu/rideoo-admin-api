const config = require('config.json');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
mongoose.connect(process.env.DB_URI ,()=>console.log("database connected to : "+process.env.DB_URI));

module.exports = {
    User: require('../model/user.model'),
    Driver: require('../model/driver.model'),
    Rider: require('../model/rider.model'),
    Car: require('../model/car.model'),
    carCategory: require('../model/carCategory.model'),
    Fare: require('../model/fare.model'),
    carModel: require('../model/carModel.model'),
    Owner: require('../model/owner.model'),
    ServiceArea: require('../model/serviceArea.model'),

    RideBooking: require('../model/rideBooking.model'),
    DriverLocation: require('../model/driverLocations.model'),
    BookingTransaction: require('../model/bookingTransaction.model'),
};