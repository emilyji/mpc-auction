const nodemailer = require('nodemailer');
const queries = require('../models/queries.js');
const async = require('async');

module.exports = {};

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMINISTRATOR_EMAIL_USER,
    pass: process.env.ADMINISTRATOR_EMAIL_PASS
  }
});

module.exports.sendNotificationEmails = function (title, description, auction_id, auction_end) {
  queries.registeredUserEmails(auction_id).then(function (emails) {
    async.each(emails, function (email, callback) { 
      var mailOptions = {
        from: process.env.ADMINISTRATOR_EMAIL_USER,
        to: email,
        subject: title,
        html: `<h1>`+title+`</h1>
              <h2>`+description+`</h2>
              <p>Thank you for registering. The auction is now live! Your bid must be submitted by `+auction_end+`.</p>
              <p>Please click the following link to submit your bid.</p>
              <a href=http://localhost:8080/login>Click here</a>`,
      };
      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
          console.log('Recipient: ' + email);
          callback();
        }
      });
    });
  });
}

module.exports.emailAuctionWinner = function (auction_id, party_id, second_highest_bid) {
  queries.getUserByPartyID(auction_id, party_id).then(function (winner) {
    if (winner.notified_auction_outcome != true) {
      var winnerEmail = winner.username;
      var mailOptions = {
        from: process.env.ADMINISTRATOR_EMAIL_USER,
        to: winnerEmail,
        subject: 'Auction Result',
        html: `<h1>Congratulations! You are the winner of Example Auction!</h1>
              <h2>The value of the second highest bid, which is the price that you must pay, is `+second_highest_bid+`.</h2>`,
      };
      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.log(error);
          return;
        } else {
          console.log('Email sent: ' + info.response);
          console.log('Recipient: ' + winnerEmail);
          queries.setNotifiedTrue(auction_id, winnerEmail).then(function () {
            console.log('Set notified_auction_outcome status to true');
            return;
          });
        }
      });
    }
  });
}

module.exports.emailAuctionLosers = function (auction_id, winner_party_id) {
  queries.getUsersPartyIDNE(auction_id, winner_party_id).then(function (losers) {
    async.each(losers, function (user, callback) { 
      if (user.notified_auction_outcome != true) {
        var email = user.username;
        var mailOptions = {
          from: process.env.ADMINISTRATOR_EMAIL_USER,
          to: email,
          subject: 'Auction Result',
          html: `<h1>Thank you for participating in Example Auction. I am sorry to inform you that you did not win.</h1>`,
        };
        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
            console.log('Recipient: ' + email);
            queries.setNotifiedTrue(auction_id, email).then(function () {
              console.log('Set notified_auction_outcome status to true');
              callback();
            });
          }
        });
      }
    });
  });
}
