var COLOR_BACKGROUND = "#FFFFFF"; // Adjust background color
var COLOR_TEXT1 = "#075aa8"; // Adjust color of number on top of bar
var COLOR_TEXT2 = "#0d034d"; // Adjust label color
var COLOR_GRIDLINE = "#000000"; // Adjust gridline color
var COLOR_BAR = [
'rgba(75, 192, 192, 0.5)',
'rgba(255, 99, 132, 0.5)',
'rgba(255, 206, 86, 0.5)',
'rgba(54, 162, 235, 0.5)'];

var COLOR_STROKE= [
'rgba(75, 192, 192, 1)',
'rgba(255, 99, 132, 1)',
'rgba(255, 206, 86, 1)',
'rgba(54, 162, 235, 1)'];
var labels = ["Yes", "No", "Help", "Other"];

var LEGEND_WIDTH = 10;
var X_TITLE_HEIGHT = 10;
var Y_TITLE_WIDTH = 10;
var X_VALUE_HEIGHT = 40;
var Y_VALUE_WIDTH = 5; // Adjust width of Y-axis values
var PLOTTER_PADDING_TOP = 0;
var PLOTTER_PADDING_RIGHT = -20;
var X_GRIDLINE_NUM = 50;
var Y_GRIDLINE_NUM = 0;

var WSP_WIDTH = 600;
var WSP_HEIGHT = 500;
var MAX_SAMPLE = 4; // Number of samples (e.g., "int1", "int2", "int3", "int4")
var X_MIN = 0;
var X_MAX = MAX_SAMPLE-1;
var Y_MIN = 0;
var Y_MAX = 50; // Adjusted maximum value for y-axis scale

var plotter_width;
var plotter_height;
var plotter_pivot_x;
var plotter_pivot_y;

var sample_count = 0;

var buffer = "";
var data = [45, 5, 8]; // Initial data array

var webSocket;
var canvas;
var ctx;

function plotter_init() {
  canvas = document.getElementById("graph");
  canvas.style.backgroundColor = COLOR_BACKGROUND;
  ctx = canvas.getContext("2d");
  canvas_resize();
  setInterval(update_plotter, 1000 / 60);
}

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

function ws_onopen() {
  document.getElementById("ws_state").innerHTML = "<span style='color: blue'>CONNECTED</span>";
  document.getElementById("btn_connect").innerHTML = "Disconnect";
}

function ws_onclose() {
  document.getElementById("ws_state").innerHTML = "<span style='color: gray'>CLOSED</span>";
  document.getElementById("btn_connect").innerHTML = "Connect";

webSocket.onopen = null;
webSocket.onclose = null;
webSocket.onmessage = null;
webSocket = null;
}

function ws_onmessage(e_msg) {
  e_msg = e_msg || window.event; // MessageEvent
  console.log(e_msg.data);
  
  // Split the data string by '\t' to get individual values
  var values = e_msg.data.split('\t');
  
  // Ensure we have exactly 4 values
  if (values.length !== 3) {
    console.error('Expected 3 values, but received:', values);
    return; // Handle error or exit function if the format is incorrect
  }

// Extract integers from the split array
var int1 = parseInt(values[0].trim(), 10);
var int2 = parseInt(values[1].trim(), 10);
var int3 = parseInt(values[2].trim(), 10);

// Check if parsing was successful (isNaN check)
if (isNaN(int1) || isNaN(int2) || isNaN(int3)) {
  console.error('One or more values could not be parsed as integers.');
  return; // Handle error or exit function if parsing failed
}

// Update data array with received values
data[0] = int1;
data[1] = int2;
data[2] = int3;
}

function map(x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function createBackgroundPattern() {
  var patternCanvas = document.createElement('canvas');
  var patternContext = patternCanvas.getContext('2d');
  patternCanvas.width = 120;
  patternCanvas.height = 30;
  
  patternContext.fillStyle = 'rgb(255,241,224,0.1)';
  patternContext.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
  patternContext.strokeStyle = '#000000';
  patternContext.strokeRect(0, 0, patternCanvas.width, patternCanvas.height);
  
  var pattern = ctx.createPattern(patternCanvas, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(20, 0, canvas.width-25, canvas.height-150);
  }

function update_plotter() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //createBackgroundPattern();
  
  // Draw gridlines
  ctx.strokeStyle = COLOR_GRIDLINE;
  // Draw gridlines (only x-axis)
  ctx.strokeStyle = COLOR_GRIDLINE;
  ctx.beginPath();
  ctx.moveTo(0, plotter_pivot_y);
  ctx.lineTo(plotter_width, plotter_pivot_y);
  ctx.stroke();
  // Draw bars with text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  var bar_width = plotter_width / data.length;
  for (var i = 0; i < data.length; i++) {
    var bar_height = -map(data[i], Y_MIN, Y_MAX, 0, plotter_height);
    ctx.fillStyle = COLOR_BAR[i % COLOR_BAR.length];
    var shiftx=10;
    var shifty = 0;
    ctx.fillRect(i * bar_width + shiftx, plotter_pivot_y - shifty, bar_width - 10, bar_height);
    // ctx.fillStyle = COLOR_STROKE[i % COLOR_STROKE.length];
    //ctx.fillStyle=COLOR_BACKGROUND
    ctx.strokeRect(i * bar_width + shiftx, plotter_pivot_y - shifty, bar_width - 10, bar_height);
  
    // Display number on top of each bar
    // ctx.fillStyle = COLOR_TEXT1;
    ctx.fillStyle = COLOR_STROKE[i % COLOR_STROKE.length];
    ctx.font="bold 20px Trebuchet MS";
    ctx.fillText(data[i], i * bar_width + bar_width / 2+ shiftx, plotter_pivot_y + bar_height - 10);
    //Add label at bottom
    ctx.font="17px Trebuchet MS";
    ctx.fillText(labels[i], i * bar_width + bar_width / 2 + shiftx, plotter_pivot_y+25);
  }
}

function canvas_resize() {
  var dpi = window.devicePixelRatio;
  var style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
  var style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
  canvas.setAttribute('height', style_height * dpi-100);
  canvas.setAttribute('width', style_width * dpi);
  
  plotter_width = WSP_WIDTH - LEGEND_WIDTH - Y_VALUE_WIDTH - Y_TITLE_WIDTH - PLOTTER_PADDING_RIGHT;
  plotter_height = WSP_HEIGHT - X_VALUE_HEIGHT - X_TITLE_HEIGHT - PLOTTER_PADDING_TOP;
  
  plotter_pivot_x = Y_VALUE_WIDTH + Y_TITLE_WIDTH;
  plotter_pivot_y = WSP_HEIGHT - X_VALUE_HEIGHT - X_TITLE_HEIGHT;
  
  ctx.lineWidth = 1;
  }

function auto_scale() {
if (data.length == 0)
  return;

var x_min = Number.MAX_VALUE;
var x_max = Number.MIN_VALUE;
var y_min = Number.MAX_VALUE;
var y_max = Number.MIN_VALUE;

for (var line = 0; line < data.length; line++) {
  for (var i = 0; i < data[line].length; i++) {
    if (data[line][i] < y_min)
      y_min = data[line][i];

    if (data[line][i] > y_max)
      y_max = data[line][i];
  }
}

if (y_max == y_min)
  y_max = y_min + 1;

Y_MIN = y_min;
Y_MAX = y_max;

X_MIN = 0;
X_MAX = MAX_SAMPLE -1;
}
