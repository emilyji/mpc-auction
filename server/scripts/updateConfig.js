const path = require('path');
const fs = require('fs');
const configFile = '../config.json';
const config = require(configFile);

const queries = require('../models/queries.js');

function editInputParties() {
  var promise = queries.totalRegisteredUsers();
  promise.then(function (count) {
    var inputParties = [];
    var ID = 4;
    for(var i = 0; i < count; i++) {
      inputParties[i]= ID;
      ID++;
    }
    config.input_parties = inputParties;
    config.party_count = config.compute_parties.length + count;
    var newConfig = JSON.stringify(config, null, 2);
    fs.writeFile(path.join(__dirname, configFile), newConfig, function(err) {
      if (err) console.log(err);
      console.log('config.json file was successfully updated');
      console.log(JSON.stringify(config, null, 2));
      process.exit();
    });
  });
}

editInputParties();