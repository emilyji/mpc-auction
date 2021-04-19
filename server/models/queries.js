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

// get total number of users that registered for the auction
module.exports.totalRegisteredUsers = function () {
  return new Promise(function (resolve, reject) {
    User.find().countDocuments(function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// get list of registered user emails
module.exports.registeredUserEmails = function () {
  return new Promise(function (resolve, reject) {
    User.find({}, 'username', function (err, data) {
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
module.exports.updatePartyID = function(party_id, email) {
  return new Promise(function (resolve, reject) {
    User.updateOne({ username: email }, { $set: {party_id: party_id} }, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// add auction ID to a specific user
module.exports.updateAuctionID = function(auction_id, email) {
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
module.exports.getUserByPartyID = function(party_id) {
  return new Promise(function (resolve, reject) {
    User.findOne({ party_id: party_id }, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// get list of emails of users with a party_id does not equal the function argument
module.exports.getUserEmailsPartyIDNE = function(party_id) {
  return new Promise(function (resolve, reject) {
    User.find({ party_id: { $ne: party_id } }, function (err, data) {
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
}

module.exports.insertAuctionInfo = function (auction_id, title, description, 
                                            registration_deadline, auction_start, auction_end) {
  var auctionInfo = new Auction({
    _id: auction_id,
    title: title,
    description: description,
    registration_deadline: registration_deadline,
    auction_start: auction_start,
    auction_end: auction_end,
    status: 'REGISTRATION_START',
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
 
module.exports.getCurrentAuctionInfo = function () {
  return new Promise(function (resolve, reject) {
    Auction.findOne({ status: 'REGISTRATION_START' }, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
