function updateConfigurationFile() {
  var auctionID = document.getElementById('auction-id').value;
  $.ajax('https://localhost:8443/update_config', {
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({auctionID: auctionID}),
    success: function (resp) {
      $('#update-button-output').append(resp);
    }  
  });
}

function notifyRegisteredUsers() {
  var auctionID = document.getElementById('auction-id').value;
  $.ajax('https://localhost:8443/notify_registered_users', {
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({auctionID: auctionID}),
    success: function (resp) {
      $('#notify-button-output').append(resp);
    }  
  });
}