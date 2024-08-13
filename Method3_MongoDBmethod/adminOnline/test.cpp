#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>

// WiFi credentials
const char* ssid = "Airtel_Khanna_OAK502";     // Replace with your WiFi credentials
const char* password = "Avni@2011";

// WebSocket server address
const char* webSocketServerAddress = "192.168.1.16"; // IP of the Node.js server
const int webSocketServerPort = 8080;
const char* webSocketServerPath = "/";

// Create WebSocket client object
WebSocketsClient webSocket;

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("\nConnected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Initialize WebSocket
  webSocket.begin(webSocketServerAddress, webSocketServerPort, webSocketServerPath);
  webSocket.onEvent(webSocketEvent);
  Serial.println("WebSocket client started.");
}

void loop() {
  // Handle WebSocket communication
  webSocket.loop();
  
  // Send data periodically (every 5 seconds)
  static unsigned long lastTime = 0;
  if (millis() - lastTime > 5000) {
    lastTime = millis();
    webSocket.sendTXT("2001\t1");
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("WebSocket Disconnected!\n");
      break;
    case WStype_CONNECTED:
      Serial.printf("WebSocket Connected to %s\n", webSocketServerAddress);
      webSocket.sendTXT("Connected to WebSocket server");
      break;
    case WStype_TEXT:
      Serial.printf("Received text: %s\n", payload);
      break;
  }
}
