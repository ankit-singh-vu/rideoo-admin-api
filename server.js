require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');
const branch = '/'+process.env.API_BRANCH;
const fileUpload = require('express-fileupload');

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});


app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles : true,
}));


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api
app.use(jwt());
console.log('api branch :'+branch );

// api routes
// app.use(branch+'/user', require('./controller/user.controller'));
// app.use(branch+'/driver', require('./controller/driver.controller'));
// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
//   });


app.use('/user', require('./controller/user.controller'));
app.use('/driver', require('./controller/driver.controller'));
app.use('/rider', require('./controller/rider.controller'));
app.use('/car', require('./controller/car.controller'));
app.use('/carCategory', require('./controller/carCategory.controller'));
app.use('/fare', require('./controller/fare.controller'));
app.use('/carModel', require('./controller/carModel.controller'));
app.use('/owner', require('./controller/owner.controller'));
app.use('/serviceArea', require('./controller/serviceArea.controller'));
app.use('/dashboard', require('./controller/dashboard.controller'));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
const server = app.listen(port, function () {
    console.log('Server listening on port ' + port);
});
