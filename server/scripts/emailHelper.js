const nodemailer = require('nodemailer');
const queries = require('../models/queries.js');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMINISTRATOR_EMAIL_USER,
    pass: process.env.ADMINISTRATOR_EMAIL_PASS
  }
});

function sendEmails() {
  var promise = queries.registeredUserEmails();
  promise.then(function (users) {
    for (var u of users) {
      var email = u.username;
      var mailOptions = {
        from: process.env.ADMINISTRATOR_EMAIL_USER,
        to: email,
        subject: 'Auction',
        html: `<h1>Example Auction</h1>
              <h2>Example Description</h2>
              <p>Thank you for registering. The auction is now live! Please click the following link to submit your bid.</p>
              <a href=http://localhost:8080/login> Click here</a>`,
      };

      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
          console.log('Recipient: ' + email);
        }
      });
    }
    process.exit();
  });
}

sendEmails();