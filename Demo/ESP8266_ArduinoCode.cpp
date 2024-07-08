#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>

const char* ssid = "Name_of_WiFi";     // Replace with your WiFi credentials
const char* password = "Password_of_WiFi";
int yes=0;int no=0;int help=0;
WebSocketsServer webSocket = WebSocketsServer(81);  // WebSocket server on port 81

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
double count=0;

void loop() {
  count=count+0.01;
  int a,b;
  //a=1 b=1 -> no input
  //a=0 b=0 -> help
  //a=1 b=0 -> yes
  //a=0 b=1 -> no

  //first module button D0,D1
  a=digitalRead(D0);
  b=digitalRead(D1);
  if (a==0 && b==0){help++;}
  else if(a==0){no++;}
  else if(b==0){yes++;}

  //second module button D2,D3
  a=digitalRead(D2);
  b=digitalRead(D3);
  if (a==0 && b==0){help++;}
  else if(a==0){no++;}
  else if(b==0){yes++;}

  //third module button D4,D5
  a=digitalRead(D4);
  b=digitalRead(D5);
  if (a==0 && b==0){help++;}
  else if(a==0){no++;}
  else if(b==0){yes++;}

  //fourth module button D6,D7
  a=digitalRead(D6);
  b=digitalRead(D7);
  if (a==0 && b==0){help++;}
  else if(a==0){no++;}
  else if(b==0){yes++;}
  
  //yes=(yes+1)%30;help=(help+2)%30; //only for testing WebSocket
  
  webSocket.loop();  // Handle WebSocket events
  
  // Simulated data (replace with your actual data acquisition)
  Serial.print(count);
  Serial.print("\t");
  Serial.print(yes);
  Serial.print("\t");  // A tab character ('\t') or a space (' ') is printed between the two values.
  Serial.print(no);
  Serial.print("\t");  // A tab character ('\t') or a space (' ') is printed between the two values.
  Serial.print(help);
  Serial.print("\n");      // A tab character ('\t') or a space (' ') is printed between the two values.

  // Format data as a string: int1 \t int2 \t int3 \t int4
  String dataToSend = String(yes) + "\t" + String(no) + "\t" + String(help);
  
  // Broadcast data over WebSocket
  webSocket.broadcastTXT(dataToSend);

  delay(1000);  // Adjust delay as needed
}
