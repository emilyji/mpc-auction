const mongoose = require('mongoose');
const AuctionSchema = new mongoose.Schema({
	_id: String,
	title: String,
	description: String,
    registration_deadline: Date,
    auction_start: Date,
    auction_end: Date,
    winner_id: Number, 
    second_highest_bid: Number,
    status: String
});
module.exports = mongoose.model('Auction', AuctionSchema);