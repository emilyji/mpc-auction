const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test', {useUnifiedTopology: true, useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log('MongoDB database connection established successfully');
});

const User = require('./user.js');

module.exports = {};

// get total number of users that registered for the auction
module.exports.totalRegisteredUsers = function () {
  return new Promise(function (resolve, reject) {
    User.find().countDocuments(function (err, count) {
      if (err) {
        reject(err);
      } else {
        resolve(count);
      }
    });
  });
};

// get list of registered user objects
module.exports.registeredUserEmails = function () {
  return new Promise(function (resolve, reject) {
    User.find({}, 'username', function (err, users) {
      if (err) {
        reject(err);
      } else {
        resolve(users);
      }
    });
  });
};

// add party ID to a specific user
module.exports.updatePartyID = function(ID, email) {
  return new Promise(function (resolve, reject) {
    User.update({ username: email }, { $set: {party_id: ID} }, function (err) {
      if (err) {
        reject(err);
      } else {
        console.log('got here');
        resolve();
      }
    });
  });
}