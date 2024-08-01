#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>

const char* ssid = "Name_of_WiFi";     // Replace with your WiFi credentials
const char* password = "Password_of_WiFi";
int response;
WebSocketsServer webSocket = WebSocketsServer(81);  // WebSocket server on port 81

// setting the ID for the device
const int numDev=4; //number of deviced connected
int moduleID=1000;
int ids[numDev];

void setupID(){
  for(int i=1;i<=numDev;i++){
    ids[i-1]=moduleID+i;
}
}

void handleWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
      }
      break;
    case WStype_TEXT:
      Serial.printf("[%u] Received data: %s\n", num, payload);
      // Handle received data if needed
      break;
  }
}

void setup() {
  setupID();
  Serial.begin(115200);
  pinMode(D0, INPUT_PULLUP);
  pinMode(D1, INPUT_PULLUP);
  pinMode(D2, INPUT_PULLUP);
  pinMode(D3, INPUT_PULLUP);
  pinMode(D4, INPUT_PULLUP);
  pinMode(D5, INPUT_PULLUP);
  pinMode(D6, INPUT_PULLUP);
  pinMode(D7, INPUT_PULLUP);
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(handleWebSocketEvent);

  Serial.println("WebSocket server started.");
}

void sendData(int id,int value){
    // Format data as a string: int1 \t int2 \t int3 \t int4
  String dataToSend = String(id) + "\t" + String(value);
  webSocket.broadcastTXT(dataToSend);
  Serial.print(dataToSend);
}

void decryptInput(int a,int b,int id){
  //a=1 b=1 -> no input
  //a=0 b=0 -> help
  //a=1 b=0 -> yes
  //a=0 b=1 -> no

  // 0->no 1->yes 2->help
    if (a==0 && b==0){
      sendData(id,2);
    }
    else if(a==0){
      sendData(id,0);
    }
    else if(b==0){
      sendData(id,1);
    }
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
  decryptInput(a,b,ids[1]);

  //fourth module button D6,D7
  a=digitalRead(D6);
  b=digitalRead(D7);
  decryptInput(a,b,ids[1]);

  
  webSocket.loop();  // Handle WebSocket events
  
  // Format data as a string: int1 \t int2 \t int3 \t int4
  // String dataToSend = String(id) + "\t" + String(no) + "\t" + String(help);
  
  // // Broadcast data over WebSocket
  // webSocket.broadcastTXT(dataToSend);

  delay(1000);  // Adjust delay as needed
}
