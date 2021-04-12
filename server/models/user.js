const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const UserSchema = new mongoose.Schema({
	username: String,
    password: String,
    party_id: Number,
});
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);