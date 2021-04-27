/**
 * Do not modify this file unless you have to.
 * This file has UI handlers.
 */

/* global config */

// eslint-disable-next-line no-unused-vars
function submit() {
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
  if (!(hostname.startsWith('https://'))) {
    hostname = 'https://' + hostname;
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
    $('#button').attr('disabled', false); 
    $('#output').append('<p>Connected to the compute parties!</p>');
    var email = $('#email').html();
    updateInputPartyID(jiff['id'], email);

    var input = parseInt($('#number').val());

    if (isNaN(input)) {
      $('#output').append("<p class='error'>Input a valid number!</p>");
    } else {
      $('#button').attr('disabled', true);
      $('#output').append('<p>Starting...</p>');
      // eslint-disable-next-line no-undef
      var promise = mpc.compute(input);
    }
  });
}

function updateInputPartyID(ID, email) {
  var params = {
    'party_id': ID,
    'user': email,
    'action': 'updateInputPartyID'
  }
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://localhost:8443/auction', true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
  xhr.send(JSON.stringify(params));
}
