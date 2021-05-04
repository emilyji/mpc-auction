/**
 * Do not modify this file unless you have to.
 * This file has UI handlers.
 */

/* global config */

// eslint-disable-next-line no-unused-vars
function submit() {
  var computation_id = 'test';

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
    var email = $('#email').html();
    updateInputPartyID(jiff['id'], email);

    var input = parseFloat($('#number').val());

    if (isNaN(input)) {
      $('#output').append("<p class='error'>Input a valid number!</p>");
    } else {
      $('#bid-submit-button').attr('disabled', true);
      $('#output').append('<p>Your bid was successfully submitted! You will receive an email about the results soon after the auction ends.</p>');
      $('#output').append('<p>You may now close this web page.</p>');

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
