var FullstackOne = function (apiServerAddress) {
  var ERROR_UNKNOWN = "ERROR_UNKNOWN";
  var ERROR_FAILED = "ERROR_FAILED";
  var ERROR_CANCEL = "ERROR_CANCEL";
  var ERROR_POPUP_BLOCKED = "ERROR_POPUP_BLOCKED";


  return {
    oAuthLogin: function (provider, cb) {
      var message = {err: ERROR_CANCEL, data: null};
      var messageReceived = false;
      var closed = false;
      var address = apiServerAddress + "/auth/oAuth/" + encodeURIComponent(provider)
      var oAuthPopup = window.open(address, "_blank");
      //var oAuthPopup = window.open(apiServerAddress + "/auth/" + encodeURIComponent(provider));

      if (oAuthPopup == null) {
        return cb("ERROR_POPUP_BLOCKED")
      }

      function receiveMessage(event) {
        if (event.origin === apiServerAddress && event.data != null) {
          message = event.data;
          messageReceived = true;
          window.removeEventListener("message", receiveMessage, false);

          if(closed === true) {
            cb(message.err, message.data);
          } else {
            setTimeout(function() {
              if(closed !== true) {
                try {
                  clearInterval(timer);
                } catch(e) {}
                cb(message.err, message.data);
              }
            }, 1000);
          }
        }
      }

      window.addEventListener("message", receiveMessage, false);

      var timer = setInterval(function() { 
          if (oAuthPopup.closed) {
              clearInterval(timer);
              closed = true;
              if (messageReceived === true) {
                cb(message.err, message.data);
              } else {
                setTimeout(function() {
                  if(messageReceived !== true) {
                    window.removeEventListener("message", receiveMessage, false);
                    cb(message.err, message.data);
                  }
                }, 1000);
              }
          }
      }, 100);
    }
  }
};
