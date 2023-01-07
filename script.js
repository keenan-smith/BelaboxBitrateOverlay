let isStreaming = false;
let config = {};

let ws = null;
let authFailed = false;
const apiKey = "ENTER API KEY HERE"

function tryConnect() {
    const proto = "wss:";
    let c = new WebSocket(proto + "//" + "remote.belabox.net" + '/ws/remote');
    c.addEventListener('message', function (event) {
      handleMessage(JSON.parse(event.data));
    });
  
    c.addEventListener('close', function (event) {
      ws = null;
  
      if (!authFailed) {
        updateStatusImage(0);
        console.log("Connection closed, trying to reconnect in 5 seconds...");
        setTimeout(tryConnect, 5000);
      }
    });
  
    c.addEventListener('open', function (event) {
      ws = c;  
      tryAuth();
    });
}

tryConnect();

function tryAuth() {  
    if (apiKey) {
      ws.send(JSON.stringify({remote: {'auth/key': {key: apiKey, version: 6}}}));
      return;
    }
}

function handleMessage(msg) {
  //console.log(msg);
  for (const type in msg) {
    switch(type) {
        case 'remote':
            handleRemoteMessage(msg[type]);
            break;
        case 'netif':
            updateNetif(msg[type]);
            break;
    }
  }
}

function handleRemoteMessage(msg) {
    for (const type in msg) {
      switch(type) {
        case 'auth/key':
          if (msg[type]) {
            console.log("Authentication successful");
          } else {
            authFailed = true;
          }
          break;
        case 'is_encoder_online':
          //todo: handle this
          break;
        case 'version':
          //todo: handle this
          break;
      }
    }
  }

function updateNetif(netifs) {
    let totalKbps = 0;
  
    for (const i in netifs) {
      data = netifs[i];
      tpKbps = Math.round((data['tp'] * 8) / 1024);
      totalKbps += tpKbps;
    }
    let estMbps = Math.floor(totalKbps / 1000);
    let conStatusNumber = 0;
    if (estMbps >= 0 && estMbps <= 1) {
        if ((totalKbps / 1024) > 0.5) {
            conStatusNumber = 1;
        }
    }
    else if (estMbps > 1 && estMbps < 5) {
        conStatusNumber = estMbps;
    }
    else {
        conStatusNumber = 5;
    }
    updateStatusImage(conStatusNumber);
}

setInterval(function() {
if (ws) {
    ws.send(JSON.stringify({keepalive: null}));
}
}, 10000);

function updateStatusImage(status) {
    $('#StatusImage').attr('src', 'images/Status' + status + '.png');
}