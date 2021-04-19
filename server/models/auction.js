const mongoose = require('mongoose');
const AuctionSchema = new mongoose.Schema({
	_id: String,
	title: String,
	description: String,
    registration_deadline: Date,
    submission_deadline: Date,
    status: String
});
module.exports = mongoose.model('Auction', AuctionSchema);