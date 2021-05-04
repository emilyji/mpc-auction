/**
 * This is a compute party: it has no input, and it receives
 * secret-shared inputs from all input parties.
 * Run this compute party from the command line as a node.js
 * server application using:
 *  node compute-party.js [path/to/configuration/file] [computation_id]
 * Configuration file path is optional, by default ./config.js
 * will be used.
 * computation_id is optional, by default it will be 'test'.
 */
var path = require('path');
console.log('Command line arguments: [/path/to/configuration/file.json] [computation_id]');

// Read config
var config = './config.json';
if (process.argv[2] != null) {
  config = './' + process.argv[2];
}

console.log('Using config file: ', path.join(__dirname, config));
config = require(config);

var all_parties = config.compute_parties.concat(config.input_parties);

// Read command line args
var computation_id = 'test';
if (process.argv[3] != null) {
  computation_id = process.argv[3];
}

// Initialize JIFF
var JIFFClient = require('./jiff/lib/jiff-client.js');
var jiffClient = new JIFFClient('http://localhost:8080', computation_id, {
  crypto_provider: config.preprocessing === false, // comment this out if you want to use preprocessing
  party_count: config.party_count,
  initialization: {role: 'compute'} // indicate to the server that this is a compute party
});

// the computation code
var compute = function () {
  jiffClient.wait_for(all_parties, function () {
    // We are a compute party, we do not have any input (thus secret is null),
    // we will receive shares of inputs from all the input_parties.
    var shares = jiffClient.share(null, null, config.compute_parties, config.input_parties);

    // Find highest bid
    var highest_bid = shares[config.input_parties[0]];
    var highest_party = config.input_parties[0];
    for (var i = 1; i < config.input_parties.length; i++) {
      var ip = config.input_parties[i];
      var cmp = highest_bid.gt(shares[ip]);
      highest_bid = cmp.if_else(highest_bid, shares[ip]);
      highest_party = cmp.if_else(highest_party, ip);
    }

    // Find second highest bid
    var cmp_first_two = shares[config.input_parties[0]].eq(highest_bid);
    var second_highest_bid = cmp_first_two.if_else(shares[config.input_parties[1]], shares[config.input_parties[0]]);
    var second_highest_party = cmp_first_two.if_else(config.input_parties[1], config.input_parties[0]);
    for (var j = 1; j < config.input_parties.length; j++) {
      var ip = config.input_parties[j];
      var cmp_gt = second_highest_bid.gt(shares[ip]);
      var temp = cmp_gt.if_else(second_highest_bid, shares[ip]);
      var cmp_eq = temp.eq(highest_bid);
      second_highest_bid = cmp_eq.if_else(second_highest_bid, temp);
      second_highest_party = cmp_eq.if_else(second_highest_party, ip);
    }

    var results = [second_highest_bid, highest_party];

    var promise = jiffClient.open_array(results, all_parties);

    promise.then(function (output) {
      jiffClient.disconnect(true, true);
    });
  });
};

// wait only for the compute parties to preprocess
jiffClient.wait_for(config.compute_parties, function () {
  if (config.preprocessing !== false) {
    // do not use crypto provider, perform preprocessing!
    jiffClient.preprocessing('open', 1, null, null, config.compute_parties, config.compute_parties, null, null, {open_parties: all_parties});
    jiffClient.executePreprocessing(compute.bind(null, jiffClient));
  } else {
    // no preprocessing: use server as crypto provider
    compute();
  }
});
