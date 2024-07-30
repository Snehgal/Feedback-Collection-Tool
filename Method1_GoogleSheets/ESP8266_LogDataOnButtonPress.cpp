#include <Arduino.h>
#include <ESP8266WiFi.h>
#include "HTTPSRedirect.h"
#define BUTTON_PIN D7  // The ESP8266 pin D7 connected to button





// Enter network credentials:
const char* ssid     = "CS";
const char* password = "AELien2005";

// Enter Google Script Deployment ID:
const char *GScriptId = "AKfycby93aY4KwxMCcVc3LPj9m8uc1vr5jH9OD-R_b_EzFWSPZf0bijTVUcsXLHq8nM6k0GD";

// Enter command (insert_row or append_row) and your Google Sheets sheet name (default is Sheet1):
String payload_base =  "{\"command\": \"insert_row\", \"sheet_name\": \"Sheet1\", \"values\": ";
String payload = "";

// Google Sheets setup (do not edit)
const char* host = "script.google.com";
const int httpsPort = 443;
const char* fingerprint = "";
String url = String("/macros/s/") + GScriptId + "/exec";
HTTPSRedirect* client = nullptr;

// Declare variables that will be published to Google Sheets
int value0 = 0;
int value1 = 0;
int value2 = 0;

// Declare variables that will keep track of whether or not the data has been published
bool data_published = false;
int error_count = 0;

void setup() {

    // Initialize the Serial to communicate with the Serial Monitor.
  Serial.begin(9600);
  // Configure the ESP8266 pin as a pull-up input: HIGH when the button is open, LOW when pressed.
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);             
  Serial.print("Connecting to ");
  Serial.print(ssid); Serial.println(" ...");

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println('\n');
  Serial.println("Connection established!");  
  Serial.print("IP address:\t");
  Serial.println(WiFi.localIP());

  // Use HTTPSRedirect class to create a new TLS connection
  client = new HTTPSRedirect(httpsPort);
  client->setInsecure();
  client->setPrintResponseBody(true);
  client->setContentTypeHeader("application/json");
  
  Serial.print("Connecting to ");
  Serial.println(host);

  // Try to connect for a maximum of 5 times
  bool flag = false;
  for (int i=0; i<5; i++){ 
    int retval = client->connect(host, httpsPort);
    if (retval == 1){
       flag = true;
       Serial.println("Connected");
       break;
    }
    else
      Serial.println("Connection failed. Retrying...");
  }
  if (!flag){
    Serial.print("Could not connect to server: ");
    Serial.println(host);
    return;
  }
  delete client;    // delete HTTPSRedirect object
  client = nullptr; // delete HTTPSRedirect object
}


void loop() {
// read the state of the switch/button:
  int button_state = digitalRead(BUTTON_PIN);

  // print out the button's state
  Serial.println(button_state);
  delay(1000);
  // attempt to publish to Google Sheets when button is pressed (when pin reads HIGH)
  if (button_state == 0)  {
    Serial.println("starting...");
    // before attempting to publish to Google Sheets, set the data_published variable to false and error_count to 0
    data_published = false;
    error_count = 0;
    
    // create some fake data to publish
    value0 ++;
    value1 = random(0,1000);
    value2 = random(0,100000);

    // the while loop will attempt to publish data up to 3 times
    while(data_published == false && error_count < 3){

      static bool flag = false;
      if (!flag){
        client = new HTTPSRedirect(httpsPort);
        client->setInsecure();
        flag = true;
        client->setPrintResponseBody(true);
        client->setContentTypeHeader("application/json");
      }
      if (client != nullptr){
        if (!client->connected()){
          client->connect(host, httpsPort);
        }
      }
      else{
        Serial.println("Error creating client object!");
      }

      // Create json object string to send to Google Sheets
      payload = payload_base + "\"" + value0 + "," + value1 + "," + value2 + "\"}";
  
      // Publish data to Google Sheets
      Serial.println("Publishing data...");
      Serial.println(payload);
    
      if(client->POST(url, host, payload)){ 
        // do stuff here if publish was successful
        data_published = true;
      }
      else{
       // do stuff here if publish was not successful
       Serial.println("Error while connecting");
       error_count++;
       delay(1000);
      }
      yield();
    } 
  }
}
