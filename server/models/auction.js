const mongoose = require('mongoose');
const AuctionSchema = new mongoose.Schema({
	_id: String,
	title: String,
	description: String,
    registration_deadline: Date,
    auction_start: Date,
    auction_end: Date,
    status: String
});
module.exports = mongoose.model('Auction', AuctionSchema);