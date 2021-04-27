function updateConfigurationFile() {
  var auctionID = document.getElementById('auction-id').innerHTML;
  auctionID = auctionID.split(' ')[1];
  $.ajax('https://localhost:8443/update_config', {
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({auctionID: auctionID}),
    success: function (resp) {
      document.getElementById('update-button-output').innerHTML = resp;
    }  
  });
}

function notifyRegisteredUsers() {
  var auctionID = document.getElementById('auction-id').innerHTML;
  auctionID = auctionID.split(' ')[1];
  $.ajax('https://localhost:8443/notify_registered_users', {
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({auctionID: auctionID}),
    success: function (resp) {
      document.getElementById('notify-button-output').innerHTML = resp;
    }  
  });
}

function emailAuctionResults() {
  var auctionID = document.getElementById('auction-id').innerHTML;
  auctionID = auctionID.split(' ')[1];
  $.ajax('https://localhost:8443/email_auction_results', {
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({auctionID: auctionID}),
    success: function (resp) {
      document.getElementById('email-results-output').innerHTML = resp;
      document.getElementById('end-auction').disabled = false;
    }  
  });
}

function closeAuction() {
  var auctionID = document.getElementById('auction-id').innerHTML;
  auctionID = auctionID.split(' ')[1];
  $.ajax('https://localhost:8443/close_auction', {
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({auctionID: auctionID}),
    success: function (resp) {
      window.location.assign('https://localhost:8443/create-auction');
    }  
  });
}

function checkBidSubmission() {
  var id = setInterval(checkConnectedInputParties, 10000);

  function checkConnectedInputParties() {
    console.log('called checkConnectedInputParties');
    var auctionID = document.getElementById('auction-id').innerHTML;
    auctionID = auctionID.split(' ')[1];
    var bidSubmissionDeadline = document.getElementById('bid-submission-deadline').innerHTML;
    bidSubmissionDeadline = Date.parse(bidSubmissionDeadline);
    var currentDateTime = new Date();
    if (currentDateTime > bidSubmissionDeadline) {
      $.ajax('https://localhost:8443/get_connected_input_parties', {
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({auctionID: auctionID}),
        success: function (resp) {
          var connectedIPcount = Object.keys(resp).length;
          if (connectedIPcount < config.input_parties.length) {
            var jiff = mpc.connect('https://localhost:8443', 'test', {party_count: config.party_count}, config);
            console.log('administratorController created a JIFF client for the input party that failed to participate');
            jiff.wait_for(config.compute_parties, function () {
              console.log('administratorController JIFF client connected to the compute parties');
              var promise = mpc.compute(0);
              console.log('administratorController JIFF client submitted a dummy bid of 0');
            });
          } else {
            console.log('ready to stop calling checkBidSubmission');
            clearInterval(id);
          }
        }  
      });
    } 
  }
}

function checkAuctionReadiness() {
  var id = setInterval(checkConnectedComputeParties, 3000);

  function checkConnectedComputeParties() {
    console.log('called checkConnectedComputeParties');
    var auctionID = document.getElementById('auction-id').innerHTML;
    auctionID = auctionID.split(' ')[1];
    var registrationDeadline = document.getElementById('registration-deadline').innerHTML;
    registrationDeadline = Date.parse(registrationDeadline);
    var currentDateTime = new Date();
    if (currentDateTime > registrationDeadline) {
      $.ajax('https://localhost:8443/get_connected_compute_parties', {
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({auctionID: auctionID}),
        success: function (resp) {
          var connectedCPcount = Object.keys(resp).length;
          if (connectedCPcount == config.compute_parties.length) {
            document.getElementById('compute-party-connection-status').innerHTML = 
            'Status: All computation parties are successfully connected to the server!';
            document.getElementById('notify-registered-users').disabled = false;
            console.log('ready to stop calling checkAuctionReadiness');
            clearInterval(id);
          } else if (connectedCPcount > 0) {
            document.getElementById('compute-party-connection-status').innerHTML = 
            'Status: '+connectedCPcount+' out of '+config.compute_parties.length+' computation parties are connected to the server';
          }
        }  
      });
    }
  }
}

function checkRegistrationEnd() {
  var id = setInterval(enableUpdateConfig, 3000);

  function enableUpdateConfig() {
    console.log('called enableUpdateConfig');
    var registrationDeadline = document.getElementById('registration-deadline').innerHTML;
    registrationDeadline = Date.parse(registrationDeadline);
    var currentDateTime = new Date();
    if (currentDateTime > registrationDeadline) {
      document.getElementById('update-config').disabled = false;
      console.log('ready to stop calling enableUpdateConfig');
      clearInterval(id);
    }
  }
}

function checkAuctionEnd() {
  var id = setInterval(checkComputationStatus, 3000);

  function checkComputationStatus() {
    console.log('called checkComputationStatus');
    var auctionID = document.getElementById('auction-id').innerHTML;
    auctionID = auctionID.split(' ')[1];
    var bidSubmissionDeadline = document.getElementById('bid-submission-deadline').innerHTML;
    bidSubmissionDeadline = Date.parse(bidSubmissionDeadline);
    var currentDateTime = new Date();
    if (currentDateTime > bidSubmissionDeadline) {
      $.ajax('https://localhost:8443/get_computation_status', {
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({auctionID: auctionID}),
        success: function (resp) {
          if (resp == 'MPC finished') {
            document.getElementById('MPC-status').innerHTML = 'Status: The computation is finished!';
            document.getElementById('email-results').disabled = false;
            console.log('ready to stop calling checkComputationStatus');
            clearInterval(id);
          } else {
            document.getElementById('MPC-status').innerHTML = 
            'Status: The computation parties are performing the secure computation on auction data';
          }
        }  
      });
    }
  }
}
