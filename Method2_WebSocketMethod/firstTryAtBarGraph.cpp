
const char *HTML_CONTENT = R"=====(
<!DOCTYPE html>
<html>
<head>
<title>ESP8266 - Web Plotter</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100vh;
  margin: 0;
}
h1 {
  font-weight: bold;
  font-size: 20pt;
  padding-bottom: 5px;
  color: navy;
}
h2 {
  font-weight: bold;
  font-size: 15pt;
  padding-bottom: 5px;
}
button {
  font-weight: bold;
  font-size: 15pt;
}
#footer {
  width: 100%;
  margin: 0;
  padding: 10px 0;
  bottom: 0;
}
.sub-footer {
  margin: 0 auto;
  position: relative;
  width: 400px;
}
.sub-footer h2 {
  margin: 0;
}
</style>
<script>
var COLOR_BACKGROUND = "#FFFFFF";
var COLOR_TEXT = "#000000";
var COLOR_BOUND = "#000000";
var COLOR_GRIDLINE = "#F0F0F0";
var COLOR_BAR = ["#0000FF", "#FF0000", "#009900"];

var LEGEND_WIDTH = 10;
var X_TITLE_HEIGHT = 40;
var Y_TITLE_WIDTH = 40;
var X_VALUE_HEIGHT = 40;
var Y_VALUE_WIDTH = 50;
var PLOTTER_PADDING_TOP = 30;
var PLOTTER_PADDING_RIGHT = 30;
var X_GRIDLINE_NUM = 4;
var Y_GRIDLINE_NUM = 5;

var WSP_WIDTH = 400;
var WSP_HEIGHT = 200;
var MAX_SAMPLE = 4; // Adjusted to 4 for "yes", "no", "help", "other"
var X_MIN = 0;
var X_MAX = MAX_SAMPLE - 1;
var Y_MIN = 0;
var Y_MAX = 10;
var X_TITLE = "X";
var Y_TITLE = "Y";

var plotter_width;
var plotter_height;
var plotter_pivot_x;
var plotter_pivot_y;

var sample_count = 0;

var buffer = "";
var data = [];

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
    webSocket = new WebSocket("ws://" + window.location.host + ":81");
    document.getElementById("ws_state").innerHTML = "CONNECTING";
    webSocket.onopen = ws_onopen;
    webSocket.onclose = ws_onclose;
    webSocket.onmessage = ws_onmessage;
    webSocket.binaryType = "arraybuffer";
  } else
    webSocket.close();
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

  buffer += e_msg.data;
  buffer = buffer.replace(/\r\n/g, "\n");
  buffer = buffer.replace(/\r/g, "\n");

  while (buffer.indexOf("\n") == 0)
    buffer = buffer.substr(1);

  if (buffer.indexOf("\n") <= 0)
    return;

  var pos = buffer.lastIndexOf("\n");
  var str = buffer.substr(0, pos);
  var new_sample_arr = str.split("\n");
  buffer = buffer.substr(pos + 1);

  data = [];

  for (var si = 0; si < new_sample_arr.length; si++) {
    var str = new_sample_arr[si];
    var arr = [];

    if (str.indexOf("\t") > 0)
      arr = str.split("\t");
    else
      arr = str.split(" ");

    for (var i = 0; i < arr.length; i++) {
      var value = parseFloat(arr[i]);

      if (isNaN(value))
        continue;

      if (i >= data.length) {
        var new_line = [value];
        data.push(new_line); // new line
      } else
        data[i].push(value);
    }

    sample_count++;
  }

  for (var line = 0; line < data.length; line++) {
    while (data[line].length > MAX_SAMPLE)
      data[line].splice(0, 1);
  }

  auto_scale();
}

function map(x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function get_random_color() {
  var letters = '0123456789ABCDEF';
  var _color = '#';

  for (var i = 0; i < 6; i++)
    _color += letters[Math.floor(Math.random() * 16)];

  return _color;
}

function update_plotter() {
  if (sample_count <= MAX_SAMPLE)
    X_MAX = sample_count - 1;
  else
    X_MAX = MAX_SAMPLE - 1;

  ctx.clearRect(0, 0, WSP_WIDTH, WSP_HEIGHT);
  ctx.save();
  ctx.translate(plotter_pivot_x, plotter_pivot_y);

  ctx.font = "bold 20px Arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = COLOR_TEXT;

  if (X_TITLE != "")
    ctx.fillText(X_TITLE, plotter_width / 2, X_VALUE_HEIGHT + X_TITLE_HEIGHT / 2);

  if (Y_TITLE != "") {
    ctx.rotate(-90 * Math.PI / 180);
    ctx.fillText(Y_TITLE, plotter_height / 2, -Y_VALUE_WIDTH - Y_TITLE_WIDTH / 2);
    ctx.rotate(90 * Math.PI / 180);
  }

  ctx.font = "16px Arial";
  ctx.textAlign = "right";
  ctx.strokeStyle = COLOR_BOUND;

  for (var i = 0; i <= Y_GRIDLINE_NUM; i++) {
    var y_gridline_px = -map(i, 0, Y_GRIDLINE_NUM, 0, plotter_height);
    y_gridline_px = Math.round(y_gridline_px) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y_gridline_px);
    ctx.lineTo(plotter_width, y_gridline_px);
    ctx.stroke();

    ctx.strokeStyle = COLOR_BOUND;
    ctx.beginPath();
    ctx.moveTo(-7, y_gridline_px);
    ctx.lineTo(4, y_gridline_px);
    ctx.stroke();

    var y_gridline_value = map(i, 0, Y_GRIDLINE_NUM, Y_MIN, Y_MAX);
    y_gridline_value = y_gridline_value.toFixed(1);

    ctx.fillText(y_gridline_value + "", -15, y_gridline_px);
    ctx.strokeStyle = COLOR_GRIDLINE;
  }

  ctx.strokeStyle = COLOR_BOUND;
  ctx.textAlign = "center";

  ctx.beginPath();
  ctx.moveTo(0.5, y_gridline_px - 7);
  ctx.lineTo(0.5, y_gridline_px + 4);
  ctx.stroke();

  for (var i = 0; i <= X_GRIDLINE_NUM; i++) {
    var x_gridline_px = map(i, 0, X_GRIDLINE_NUM, 0, plotter_width);
    x_gridline_px = Math.round(x_gridline_px) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x_gridline_px, 0);
    ctx.lineTo(x_gridline_px, -plotter_height);
    ctx.stroke();

    ctx.strokeStyle = COLOR_BOUND;
    ctx.beginPath();
    ctx.moveTo(x_gridline_px, 7);
    ctx.lineTo(x_gridline_px, -4);
    ctx.stroke();

    var x_gridline_value;
    if (sample_count <= MAX_SAMPLE)
      x_gridline_value = map(i, 0, X_GRIDLINE_NUM, X_MIN, X_MAX);
    else
      x_gridline_value = map(i, 0, X_GRIDLINE_NUM, sample_count - MAX_SAMPLE, sample_count - 1);

    // Set x-axis labels
    const xLabels = ["yes", "no", "help", "other"];
    if (i < xLabels.length) {
      ctx.fillText(xLabels[i], x_gridline_px, X_VALUE_HEIGHT / 2 + 5);
    } else {
      ctx.fillText(Math.round(x_gridline_value) + "", x_gridline_px, X_VALUE_HEIGHT / 2 + 5);
    }

    ctx.strokeStyle = COLOR_GRIDLINE;
  }

  for (var line = 0; line < data.length; line++) {
    ctx.fillStyle = COLOR_BAR[line % COLOR_BAR.length];

    var bar_width = plotter_width / (X_MAX - X_MIN + 1) * 0.8;
    var offset = bar_width * 0.1;

    for (var i = 0; i < data[line].length; i++) {
      var x = map(i, X_MIN, X_MAX, 0, plotter_width);
      var bar_height = -map(data[line][i], Y_MIN, Y_MAX, 0, plotter_height);
      ctx.fillRect(x + offset, 0, bar_width, bar_height);
    }
  }

  ctx.restore();
}

function canvas_resize() {
  var dpi = window.devicePixelRatio;
  var style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
  var style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
  canvas.setAttribute('height', style_height * dpi);
  canvas.setAttribute('width', style_width * dpi);

  plotter_width = WSP_WIDTH - LEGEND_WIDTH - Y_VALUE_WIDTH - Y_TITLE_WIDTH - PLOTTER_PADDING_RIGHT;
  plotter_height = WSP_HEIGHT - X_VALUE_HEIGHT - X_TITLE_HEIGHT - PLOTTER_PADDING_TOP;

  plotter_pivot_x = Y_VALUE_WIDTH + Y_TITLE_WIDTH;
  plotter_pivot_y = WSP_HEIGHT - X_VALUE_HEIGHT - X_TITLE_HEIGHT;
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
  X_MAX = MAX_SAMPLE - 1;
}
</script>
</head>
<body onload="plotter_init();">
  <h1>ESP8266 - Web Plotter</h1>
  <canvas id="graph" width="400" height="400"></canvas>
  <div id="footer">
    <div class="sub-footer">
      <h2 id="ws_state">CLOSED</h2>
      <button id="btn_connect" onclick="plotter_to_esp8266();">Connect</button>
    </div>
  </div>
</body>
</html>
)=====";
