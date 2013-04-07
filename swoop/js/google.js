function signinCallback(authResult) {
  if (authResult['access_token']) {
    // Successfully authorized
    // Hide the sign-in button now that the user is authorized, for example:
    //document.getElementById('signinButton').setAttribute('style', 'display: none');
    gapi.client.load('plus','v1', function(){
      var request = gapi.client.plus.people.get({
        'userId': "me"
      });
      request.execute(function(resp) {
        swoop.setSigned(true, resp, authResult['access_token']);
      });
    });
  } else if (authResult['error']) {
    swoop.setSigned(false, null);
  }
}

function disconnectUser() {
  access_token = swoop.getToken();
  var revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' +
      access_token;

  // Perform an asynchronous GET request.
  $.ajax({
    type: 'GET',
    url: revokeUrl,
    async: false,
    contentType: "application/json",
    dataType: 'jsonp',
    success: function(nullResponse) {
      // Do something now that user is disconnected
      // The response is always undefined.
      swoop.setSigned(false, null);
    },
    error: function(e) {
      // Handle the error
      // console.log(e);
      // You could point users to manually disconnect if unsuccessful
      // https://plus.google.com/apps
    }
  });
}