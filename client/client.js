/**
 * Do not modify this file unless you have to.
 * This file has UI handlers.
 */

/* global config */

// eslint-disable-next-line no-unused-vars
function connect() {
  $('#connectButton').prop('disabled', true);
  var computation_id = $('#computation_id').val();

  var options = { party_count: config.party_count };
  options.onError = function (_, error) {
    $('#output').append("<p class='error'>"+error+'</p>');
  };

  var hostname = window.location.hostname.trim();
  var port = window.location.port;
  if (port == null || port === '') {
    port = '80';
  }
  if (!(hostname.startsWith('http://') || hostname.startsWith('https://'))) {
    hostname = 'http://' + hostname;
  }
  if (hostname.endsWith('/')) {
    hostname = hostname.substring(0, hostname.length-1);
  }
  if (hostname.indexOf(':') > -1 && hostname.lastIndexOf(':') > hostname.indexOf(':')) {
    hostname = hostname.substring(0, hostname.lastIndexOf(':'));
  }

  hostname = hostname + ':' + port;
  // eslint-disable-next-line no-undef
  var jiff = mpc.connect(hostname, computation_id, options, config);
  jiff.wait_for(config.compute_parties, function () {
    $('#button').attr('disabled', false); $('#output').append('<p>Connected to the compute parties!</p>');
    sendUserID(jiff['id']);
  });
}

// eslint-disable-next-line no-unused-vars
function submit() {
  var input = parseInt($('#number').val());

  if (isNaN(input)) {
    $('#output').append("<p class='error'>Input a valid number!</p>");
  } else if (100 < input || input < 0 || input !== Math.floor(input)) {
    $('#output').append("<p class='error'>Input a WHOLE number between 0 and 100!</p>");
  } else {
    $('#button').attr('disabled', true);
    $('#output').append('<p>Starting...</p>');
    // eslint-disable-next-line no-undef
    var promise = mpc.compute(input);
    promise.then(function (opened_array) {
      var results = {
        'second_highest_bid': opened_array[0],
        'highest_party': opened_array[1]
      };
      handleResult(results);
      sendWinnerID(results);
    });
  }
}

function handleResult(results) {
  $('#output').append('<p>The second highest bid is ' + results.second_highest_bid
                       + ' and the winner is ' + results.highest_party + '.</p>');
  $('#button').attr('disabled', false);
}

function sendUserID(ID) {
  var params = {
    'party_id': ID,
    'action': 'sendUserID'
  }
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:8080/auction', true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
  xhr.send(JSON.stringify(params));
  console.log("got here 1");
}

function sendWinnerID(results) {
  var params = results;
  params.action = 'sendWinnerID'
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:8080/auction', true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
  xhr.send(JSON.stringify(params));
}