function plotter_to_esp8266() {
    if (webSocket == null) {
      // Replace "<ESP8266_IP_ADDRESS>" with your ESP8266 IP address
      webSocket = new WebSocket("ws://192.168.1.6:81");
      document.getElementById("ws_state").innerHTML = "CONNECTING";
      webSocket.onopen = ws_onopen;
      webSocket.onclose = ws_onclose;
      webSocket.onmessage = ws_onmessage;
      webSocket.binaryType = "arraybuffer";
  } else {
      webSocket.close();
  }
  }

