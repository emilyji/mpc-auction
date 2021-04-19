const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const UserSchema = new mongoose.Schema({
	username: String,
    password: String,
    party_id: Number,
    auction_id: String,
    notified: Boolean
});
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);