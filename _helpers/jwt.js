const expressJwt = require('express-jwt');
const config = require('config.json');
const userService = require('../service/user.service');

module.exports = jwt;

function jwt() {
    const secret = config.secret;
    return expressJwt({ secret, algorithms: ['HS256'], isRevoked }).unless({
        path: [
            // public routes that don't require authentication
            '/user/admin-authenticate',
            // '/dev/user/admin-sign-up',
            '/user/admin-sign-up',
            // '/user',
            // '/driver/admin-authenticate',
            // '/driver/admin-sign-up',
            // '/driver',
            // '/carCategory',
            // '/fare',
        ]
    });
}

async function isRevoked(req, payload, done) {
    const user = await userService.getById(payload.sub);

    // revoke token if user no longer exists
    if (!user) {
        return done(null, true);
    }

    done();
};