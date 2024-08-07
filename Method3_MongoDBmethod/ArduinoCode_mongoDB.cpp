#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>

// WiFi credentials
const char* ssid = "CS";     // Replace with your WiFi credentials
const char* password = "AELien2005";

// WebSocket server address
const char* webSocketServerAddress = "192.168.62.147"; // IP of the Node.js server
const int webSocketServerPort = 8080;
const char* webSocketServerPath = "/";

// Create WebSocket client object
WebSocketsClient webSocket;

// Device settings
const int numDevices = 4; // Number of devices connected
const int moduleID = 1000; // Base ID for devices
int ids[numDevices];

// Setup function for IDs
void setupID() {
  for (int i = 0; i < numDevices; i++) {
    ids[i] = moduleID + i + 1; // Adjust ID assignment
  }
}

void setup() {
  setupID();
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
  
  //setting up input pins
  pinMode(D0, INPUT_PULLUP);
  pinMode(D1, INPUT_PULLUP);
  pinMode(D2, INPUT_PULLUP);
  pinMode(D3, INPUT_PULLUP);
  pinMode(D4, INPUT_PULLUP);
  pinMode(D5, INPUT_PULLUP);
  pinMode(D6, INPUT_PULLUP);
  pinMode(D7, INPUT_PULLUP);
  }

// Function to send data
void sendData(int id, int value) {
  String dataToSend = String(id) + "\t" + String(value);
  webSocket.sendTXT(dataToSend);
  Serial.print("Sent:");
  Serial.println(dataToSend);
}

// Function to decrypt and process input
void decryptInput(int a, int b, int id) {
  int value;
  if (a == 0 && b == 0) {
    value = 2; // help
  } else if (a == 0) {
    value = 0; // no
  } else if (b == 0) {
    value = 1; // yes
  } else {
    return; // no action if no valid input
  }
  sendData(id, value);
}

void loop() {
  int a=1;
  int b=1;
  //a=1 b=1 -> no input
  //a=0 b=0 -> help
  //a=1 b=0 -> yes
  //a=0 b=1 -> no

  //first module button D0,D1
  a=digitalRead(D0);
  b=digitalRead(D1);
  decryptInput(a,b,ids[0]);

  //second module button D2,D3
  a=digitalRead(D2);
  b=digitalRead(D3);
  decryptInput(a,b,ids[1]);

  //third module button D4,D5
  a=digitalRead(D4);
  b=digitalRead(D5);
  decryptInput(a,b,ids[2]);

  //fourth module button D6,D7
  a=digitalRead(D6);
  b=digitalRead(D7);
  decryptInput(a,b,ids[3]);

  // Handle WebSocket communication
  webSocket.loop();
  delay(500);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("WebSocket Disconnected!\n");
      break;
    case WStype_CONNECTED:
      Serial.printf("WebSocket Connected to %s\n", webSocketServerAddress);
      // webSocket.sendTXT("Connected to WebSocket server");
      break;
    case WStype_TEXT:
      Serial.printf("Sent text: %s\n", payload);
      break;
  }
}
