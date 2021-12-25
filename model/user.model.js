const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// const schema = new Schema({
//     username: { type: String, unique: true, required: true },
//     hash: { type: String, required: true },
//     firstName: { type: String, required: true },
//     lastName: { type: String, required: true },
//     createdDate: { type: Date, default: Date.now }
// });

const schema = new Schema({
    email: { type: String, unique: true, required: true },
    hash: { type: String, required: true },
    fullName: { type: String, required: true },
    createdDate: { type: Date, default: Date.now }
});


schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.hash;
    }
});

module.exports = mongoose.model('rido_admin', schema);