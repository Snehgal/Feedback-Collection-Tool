# SurveySync - A Feedback Collection Tool

Using the ESP8266 (NodeMCU) to send data through WebSocket and log this data into a database, and create a dashboard to show the data changes in real time.

## Demo

For the first demo, dated 10/06/2024, there are two files in the "Demo Folder". Here are the steps to follow for a demo:
### ESP8266_ArduinoCode.cpp
- For setting up the Arduino IDE for ESP8266, follow [Installing the ESP8266 Core](https://lastminuteengineers.com/getting-started-with-esp8266/)
- Go to the 'Library Manager' in the Arduino IDE (left vertical bar, third option from top) and download "WebSockets Markus Sattler" version 2.4.1. 
- Copy the code to Arduino IDE, and change lines 3 and 4 to the WiFi SSID and Password
  ```
    const char* ssid = "Name_of_WiFi";
    const char* password = "Password_of_WiFi";
  ```
- Assuming you're using 4 button circuits, connect the circuits pairwise to the ESP8266 pins labelled as follows:
  - Device 1 to D0 and D1
  - Device 2 to D2 and D3
  - Device 3 to D4 and D5
  - Device 4 to D6 and D7
- Upload the code to ESP8266, and open the serial monitor (Tools -> Serial Monitor)
>#### Note
> If the serial monitor shows random question marks, switch the drop-down on the top right of the Serial Monitor labelled "Baud" and change the value to '115200.'

>#### Extra Info
>
>All pins are initiated to pinMode called INPUT_PULLUP, wherein the default state of the pin is 1, and the input must be ground for the value to change. This is better than the simple INPUT mode, which is defaulted to 0 and reads 1 on input. The latter is very sensitive to external noise and is rarely used except for sensitive equipment.
>The concern here, which needs to be practically tested, is the sensitivity of the pin, even in INPUT_PULLUP mode. If it is too sensitive to voltage change, it could result in a log of false values (see 'Fix 1'). However, if it is not sensitive enough, that is, even small non-zero voltage values show a high (1) state, which could easily be caused by some kind of current leak in the circuit, then it may need to be fixed. In case this happens, please approach the instructor for advice.
##### Fix 1
Add this line to line 60:
```
  int numberOfReads=10; //can be changed to increase accuracy
  int checkThreshold=8;
  int counta,countb;
```
Replace **each if-block** in lines 68-81 in the code with the following:
```
  counta=0;countb=0;

  for(int i=0;i<numberOfReads;i++){
    a=digitalRead(D0); //change to D2,D4,D6 according to device numbr
    b=digitalRead(D1); //change to D3,D5,D7 according to devide number
    if(a==0){counta++;}
    if(b==0){countb++;}
  }
  a=1;b=1;
  if(counta>=checkThreshold){a=0;}
  if(countb>=checkThreshold){b=0;}
  if (a==0 && b==0){help++;}
  else if(a==0){no++;}
  else if(b==0){yes++;}
```
This code will check the button input 10 times, but it also means that the person will have to hold down the button for about a second for the response to register.

### main.html
- Install the [npm Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.npm-intellisense) and [Path Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.path-intellisense) libraries within VS Code from the Extensions (Ctrl+Shift+X).
- Install Node.js from [How to Install Node.js](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs)
- Open the ouput window, click on the drop-dwon next to the '+' sign to open the Command Prompt. Type ```npm i ws``` to install websocket libraries
- Copy and paste this code in VS Code or even NotePad, and save it as a .html file.
- Go to your browser and type the entire file address in the address bar; for example, if the file is saved in C:/Snehgal/FCT and named main.html, then type *C:/Snehgal/FCT/main.html* in your browser.
- Ensuring that the ESP8266 code has been uploaded and the serial monitor is showing some activity (ideally, a decimal value showing number of requests made, divided by 1000 and 3 numbers, the values of yes, no and help variables being broadcasted), press the connect button and wait for the connection to establish.

>#### Testing
>Uncomment line 89 in [ESP8266_ArduinoCode.cpp](https://github.com/Snehgal/Feedback-Collection-Tool/edit/main/Demo/ESP8266_ArduinoCode.cpp) which will simulate changes in the graph artifically.

>#### To check errors
>
>Right-click on the website, select 'Inspect Element', and on the top bar, go to 'Console'. Any errors will be logged here, and so will the values of yes  and no and help arriving to the script through WebSocket.

## Web Socket Method

## Google Sheets Method
