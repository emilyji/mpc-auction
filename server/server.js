/**
 * This is a server instance, it just routes communication
 * between different parties.
 * To run, use:
 *  node server.js [path/to/configuration/file]
 * Configuration file path is optional, by default ./config.js
 * will be used.
 */
console.log('Command line arguments: [/path/to/configuration/file.json]');

// Server setup
var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');

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

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb://localhost/test');

// app.set('view engine', 'ejs');

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

// Serve static files.
app.get('/config.js', function (req, res) {
  var str = 'var config = \'' + JSON.stringify(config) + '\';\n';
  str += 'config = JSON.parse(config);';
  res.send(str);
});

// Registration form
app.get('/', function (req,res) {
  res.sendFile(path.join(__dirname, '../client/views/register.html'));
});

// Auction bidding page
app.get('/auction', isLoggedIn, function (req, res) {
  // console.log("hello", req.username);
  res.sendFile(path.join(__dirname, '../client/views/auction.html'));
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
      res.sendFile(path.join(__dirname, '../client/views/signup_success.html'));
    });
  });
});

// app.post('/auction', function (req, res) {
//   if (req.body.action === 'sendUserID') {
//     console.log('hello 1', req.username);
//     console.log(req.body);
//   } else if (req.body.action === 'sendWinnerID') {
//     console.log('hello 2', req.username);
//     console.log(req.body);
//   } else {
//     console.log('something is wrong');
//   }
// });

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
  console.log('listening on *:8080');
});

console.log('** To run a compute party, use the command line and run node compute-party.js [configuration-file] [computation-id]');
console.log('All compute parties must be running before input parties can connect, an input party can leave');
console.log('any time after it submits its input.');
console.log('');