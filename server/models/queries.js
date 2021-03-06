const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test', {useUnifiedTopology: true, useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log('MongoDB database connection established successfully');
});

const User = require('./user.js');
const Auction = require('./auction.js');

module.exports = {};

// get total number of users that registered for a specific auction
module.exports.totalRegisteredUsers = function (auction_id) {
  return new Promise(function (resolve, reject) {
    User.countDocuments({ auction_id: auction_id }, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// get list of registered user emails for a specific auction
module.exports.registeredUserEmails = function (auction_id) {
  return new Promise(function (resolve, reject) {
    User.find({ auction_id: auction_id }, function (err, data) {
      if (err) {
        reject(err);
      } else {
        let emails = [];
        for (var d of data) {
          emails.push(d.username);
        }
        resolve(emails);
      }
    });
  });
};

// add party ID to a specific user
module.exports.updatePartyID = function (auction_id, party_id, email) {
  return new Promise(function (resolve, reject) {
    User.updateOne({ $and: [{username: email}, {auction_id: auction_id}] }, { $set: {party_id: party_id} }, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// add auction ID to a specific user
module.exports.updateAuctionID = function (auction_id, email) {
  return new Promise(function (resolve, reject) {
    User.updateOne({ username: email }, { $set: {auction_id: auction_id} }, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// find user by party ID
module.exports.getUserByPartyID = function (auction_id, party_id) {
  return new Promise(function (resolve, reject) {
    User.findOne({ $and: [{auction_id: auction_id}, {party_id: party_id}] }, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// get list of emails of users with a party_id that does not equal the function argument
module.exports.getUsersPartyIDNE = function (auction_id, party_id) {
  return new Promise(function (resolve, reject) {
    User.find({ $and: [{auction_id: auction_id}, { party_id: { $ne: party_id } }] }, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports.clearUsers = function () {
  return new Promise(function (resolve, reject) {
    User.deleteMany({}, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports.setNotifiedTrue = function (auction_id, email) {
  return new Promise(function (resolve, reject) {
    User.updateOne({ $and: [{username: email}, {auction_id: auction_id}] }, { $set: {notified_auction_outcome: true} }, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports.insertAuctionInfo = function (auction_id, title, description, img,
                                            registration_deadline, auction_start, auction_end) {
  var auctionInfo = new Auction({
    _id: auction_id,
    title: title,
    description: description,
    img: img,
    registration_deadline: registration_deadline,
    auction_start: auction_start,
    auction_end: auction_end,
    status: 'REGISTRATION',
  });

  return new Promise(function (resolve, reject) {
    auctionInfo.save(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports.totalAuctions = function () {
  return new Promise(function (resolve, reject) {
    Auction.find().countDocuments(function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// find auction by auction ID
module.exports.getAuctionInfo = function (auction_id) {
  return new Promise(function (resolve, reject) {
    Auction.findOne({ _id: auction_id }, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
 
module.exports.getCurrentAuctionInfo = function () {
  return new Promise(function (resolve, reject) {
    Auction.findOne({ status: { $in: [ 'REGISTRATION', 'LIVE' ] }}, function (err, data) {
      if (err) {
        reject(err);
      } else {
        if (data == null) {
          var message = 'no auctions are open for registration or live';
          resolve(message);
        }
        else {
          var options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'};

          var dateString = new Date(data.registration_deadline).toLocaleTimeString('en-US', options);
          data.registration_deadline_string = dateString;

          dateString = new Date(data.auction_start).toLocaleTimeString('en-US', options);
          data.auction_start_string = dateString;

          dateString = new Date(data.auction_end).toLocaleTimeString('en-US', options);
          data.auction_end_string = dateString;

          var img_to_send = data.img;
          var base64data = img_to_send.data.toString('base64');
          data.img.data = base64data;

          resolve(data);
        }
      }
    });
  });
}

module.exports.updateAuctionStatus = function (auction_id, status) {
  return new Promise(function (resolve, reject) {
    Auction.updateOne({ _id: auction_id }, { $set: { status: status }}, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports.insertAuctionResults = function (auction_id, winner_id, second_highest_bid) {
  return new Promise(function (resolve, reject) {
    Auction.updateOne({ _id: auction_id }, { $set: {winner_id: winner_id, second_highest_bid: second_highest_bid} }, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports.getAuctionResults = function (auction_id) {
  return new Promise(function (resolve, reject) {
    Auction.findOne({ $and: [{ _id: auction_id }, { winner_id: {$exists: true} }, { second_highest_bid: {$exists: true} }] }, function (err, data) {
      if (err) {
        reject(err);
      } else {
        if (data == null) {
          var message = 'the auction results have not been computed yet';
          resolve(message);
        }
        else {
          resolve(data);
        }
      }
    });
  });
}

module.exports.clearAuctions = function () {
  return new Promise(function (resolve, reject) {
    Auction.deleteMany({}, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
