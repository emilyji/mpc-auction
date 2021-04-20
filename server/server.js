/**
 * This is a server instance, it just routes communication
 * between different parties.
 * To run, use:
 *  node server.js [path/to/configuration/file]
 * Configuration file path is optional, by default ./config.js
 * will be used.
 */
console.log('Command line arguments: [/path/to/configuration/file.json]');
var fs = require('fs');
var path = require('path');
const {v4 : uuidv4} = require('uuid');

// Server setup
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var https = require('https').createServer({
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost.pem'),
}, app);

// body parser to handle json data
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB setup
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var User = require('./models/user');
var queries = require('./models/queries');

var emailHelper = require('./scripts/emailHelper');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb://localhost/test');

app.use(require('express-session')({
  secret: 'temp',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
  
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },  
  User.authenticate()
));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Read configuration
var config = './config.json';
if (process.argv[2] != null) {
  config = './' + process.argv[2];
}

console.log('Using config file: ', path.join(__dirname, config));
config = require(config);

// Keep track of assigned ids
var assignedCompute = {};
var assignedInput = {};
var options = {
  logs: true,
  hooks: {
    beforeInitialization: [
      function (jiff, computation_id, msg, params) {
        console.log('got called with', msg.role);
        if (params.party_id != null) {
          return params;
        }

        var search = config.compute_parties;
        var check = assignedCompute;
        if (msg.role === 'input') {
          search = config.input_parties;
          check = assignedInput;
        }

        for (var p = 0; p < search.length; p++) {
          var id = search[p];
          if (check[id] === true) {
            continue;
          }

          check[id] = true;
          params.party_id = id;
          return params;
        }

        return params;
      }
    ]
  }
};

// Create the server
var JIFFServer = require('../jiff/lib/jiff-server');
var jiffRestAPIServer = require('../jiff/lib/ext/jiff-server-restful.js');
var jiffServer = new JIFFServer(http, options);
jiffServer.apply_extension(jiffRestAPIServer, {app: app});

var nunjucks = require('nunjucks');
nunjucks.configure(path.join(__dirname, '/../client/'), {
  autoescape: true,
  express: app
});
app.set('view engine', 'html');

// Serve static files.
app.get('/config.js', function (req, res) {
  var str = 'var config = \'' + JSON.stringify(config) + '\';\n';
  str += 'config = JSON.parse(config);';
  res.send(str);
});

app.get('/create-auction', function (req, res) {
  res.render(path.join(__dirname, '../client/views/create'));
}); 

app.post('/create-auction', function (req, res) {
  const auctionID = uuidv4();
  console.log(req.body);
  var promise = queries.insertAuctionInfo(auctionID, req.body.auctionTitle, req.body.auctionDescription,
                                          req.body.auctionRegistrationDeadline, req.body.auctionStart, req.body.auctionEnd);
  promise.then(function () {
    console.log('successfully added auction info to database', req.body);
    res.redirect('/manage');
  });
});

app.get('/manage', function (req, res) {
  res.render(path.join(__dirname, '../client/views/manage'));
});

// Registration form
app.get('/', function (req,res) {
  var promise = queries.totalAuctions();
  promise.then(function (count) {
    if (count === 0) {
      res.render(path.join(__dirname, '../client/views/registration_closed.html'));
    }
    else {
      var promise = queries.getCurrentAuctionInfo();
      promise.then(function (data) {
        console.log(data);
        res.render(path.join(__dirname, '../client/views/register'), 
                  {title: data.title, description: data.description, deadline: data.registration_deadline,
                   auction_id: data._id});
      })
    }
  });
});

// Handling user registration
app.post('/', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  User.register(new User({ username: email }), password, function (err, user) {
    if (err) {
      console.log(err);
      return res.sendFile(path.join(__dirname, '../client/views/register.html'));
    }
    passport.authenticate("local")(
      req, res, function () {
      var promise = queries.updateAuctionID(req.body.auctionID, email);
      promise.then(function () {
        console.log('successfully updated auction ID of user', email);
        res.sendFile(path.join(__dirname, '../client/views/signup_success.html'));
      });
    });
  });
});

// Auction bidding page
app.get('/auction', isLoggedIn, function (req, res) {
  var promise = queries.getCurrentAuctionInfo();
  promise.then(function (data) {
    res.render(path.join(__dirname, '../client/views/auction'), 
              {email: req.user.username, title: data.title, description: data.description,
               auction_id: data._id, end: data.auction_end});
  });
});

app.post('/auction', function (req, res) {
  if (req.body.action === 'updateInputPartyID') {
    var promise = queries.updatePartyID(req.body.party_id, req.body.user);
    promise.then(function () {
      console.log('successfully updated party ID of user', req.body.user);
    });
  } else if (req.body.action === 'sendAuctionWinner') {
    emailHelper.emailAuctionWinner(req.body.winner_ID, req.body.second_highest_bid);
    console.log('successfully emailed the auction winner');
    emailHelper.emailAuctionLosers(req.body.winner_ID);
    console.log('successfully emailed the auction losers');
  } else {
    console.log('something is wrong');
  }
});

//Showing login page
app.get('/login', function (req, res) {
  res.sendFile(path.join(__dirname, '../client/views/login.html'));
});

//Handling user login
app.post('/login', passport.authenticate('local', {
  successRedirect: '/auction',
  failureRedirect: '/login'
}), function (req, res) {
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

app.use('/', express.static(path.join(__dirname, '..', 'client')));
app.use('/dist', express.static(path.join(__dirname, '..', 'jiff', 'dist')));
app.use('/lib/ext', express.static(path.join(__dirname, '..', 'jiff', 'lib', 'ext')));

http.listen(8080, function () {
  console.log('listening on *:8080 for http');
});
https.listen(8443, function () {
  console.log('listening on *:8443 for https');
});

console.log('** To run a compute party, use the command line and run node compute-party.js [configuration-file] [computation-id]');
console.log('All compute parties must be running before input parties can connect, an input party can leave');
console.log('any time after it submits its input.');