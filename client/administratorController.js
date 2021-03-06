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

function emailAuctionResults(include_sale_price) {
  var auctionID = document.getElementById('auction-id').innerHTML;
  auctionID = auctionID.split(' ')[1];
  $.ajax('https://localhost:8443/email_auction_results', {
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({auctionID: auctionID, includeSalePrice: include_sale_price}),
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
    currentDateTime = currentDateTime.toLocaleString();
    currentDateTime = Date.parse(currentDateTime);
    if (currentDateTime > bidSubmissionDeadline) {
      $.ajax('https://localhost:8443/get_connected_input_parties', {
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({auctionID: auctionID}),
        success: function (resp) {
          var connectedIPcount = Object.keys(resp).length;
          $.get('https://localhost:8443/get_config', function(data, status) {
            if (connectedIPcount < data.input_parties.length) {
              var jiff = mpc.connect('https://localhost:8443', 'test', {party_count: data.party_count}, data);
              console.log('administratorController created a JIFF client for the input party that failed to participate');
              jiff.wait_for(data.compute_parties, function () {
                console.log('administratorController JIFF client connected to the compute parties');
                var promise = mpc.compute(parseFloat(0));
                console.log('administratorController JIFF client submitted a dummy bid of 0');
                promise.then(function (opened_array) {
                  var results = {
                    'second_highest_bid': opened_array[0],
                    'winner_ID': opened_array[1]
                  };
                  var params = results;
                  params.action = 'sendAuctionWinner'
                  var xhr = new XMLHttpRequest();
                  xhr.open('POST', 'https://localhost:8443/auction', true);
                  xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
                  xhr.send(JSON.stringify(params));
                });
              });
            } else {
              console.log('ready to stop calling checkBidSubmission');
              clearInterval(id);
            }
          });
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
    currentDateTime = currentDateTime.toLocaleString();
    currentDateTime = Date.parse(currentDateTime);
    if (currentDateTime > registrationDeadline) {
      $.ajax('https://localhost:8443/get_connected_compute_parties', {
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({auctionID: auctionID}),
        success: function (resp) {
          var connectedCPcount = Object.keys(resp).length;
          $.get('https://localhost:8443/get_config', function(data, status) {
            if (connectedCPcount == data.compute_parties.length) {
              document.getElementById('compute-party-connection-status').innerHTML = 
              '<strong>Status:</strong> All compute parties are successfully connected to the server!';
              document.getElementById('notify-registered-users').disabled = false;
              console.log('ready to stop calling checkAuctionReadiness');
              clearInterval(id);
            } else if (connectedCPcount > 0) {
              document.getElementById('compute-party-connection-status').innerHTML = 
              '<strong>Status:</strong> '+connectedCPcount+' out of '+data.compute_parties.length+' compute parties are connected to the server';
            }
          });
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
    currentDateTime = currentDateTime.toLocaleString();
    currentDateTime = Date.parse(currentDateTime);
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
    currentDateTime = currentDateTime.toLocaleString();
    currentDateTime = Date.parse(currentDateTime);
    if (currentDateTime > bidSubmissionDeadline) {
      $.ajax('https://localhost:8443/get_computation_status', {
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({auctionID: auctionID}),
        success: function (resp) {
          if (resp == 'MPC has not finished') {
            document.getElementById('MPC-status').innerHTML = 
            '<strong>Status:</strong> The compute parties are securely computing the auction results';
          } else {
            document.getElementById('MPC-status').innerHTML = '<strong>Status:</strong> The computation is finished!';
            document.getElementById('auction-winner').innerHTML = '<strong>Auction winner:</strong> '+resp.winner;
            document.getElementById('auction-price').innerHTML = '<strong>Second-highest bid:</strong> $'+resp.second_highest_bid;
            document.getElementById('email-results').disabled = false;
            document.getElementById('email-results-sale-price').disabled = false;
            console.log('ready to stop calling checkComputationStatus');
            clearInterval(id);
          }
        }  
      });
    }
  }
}
