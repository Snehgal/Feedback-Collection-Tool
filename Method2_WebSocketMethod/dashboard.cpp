
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
      border: 5px solid black; /* Added border */
      width: 800px; /* Set width to 800px */
      height: 800px; /* Set height to 800px */
      box-sizing: border-box; /* Include border in dimensions */
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
    var Y_MAX = 1000; // Adjusted maximum value for y-axis scale to 1000
    var X_TITLE = "X";
    var Y_TITLE = "Number of Students";

    var plotter_width;
    var plotter_height;
    var plotter_pivot_x;
    var plotter_pivot_y;

    var sample_count = 0;

    var buffer = "";
    var data = [0, 0, 0, 0];

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
    var i=0;
    function ws_onmessage(e_msg) {
      // Ensure e_msg is defined and accessible
      e_msg = e_msg || window.event; // MessageEvent
      
      // Log the entire message payload for debugging
      console.log(e_msg.data);
        
      // Split the data string by '\t' to get individual values
      var values = e_msg.data.split('\t');
      
      // Ensure we have exactly 4 values
      if (values.length !== 1) {
        console.error('Expected 1 value, but received:', values);
        return; // Handle error or exit function if the format is incorrect
      }
      
      // Extract integers from the split array
      var int1 = parseInt(values[0].trim(), 10);
      // Check if parsing was successful (isNaN check)

      if (isNaN(int1)) {
        console.error('One or more values could not be parsed as integers.');
        return; // Handle error or exit function if parsing failed
      }
      
      // Now you have the 4 integer values
      console.log('Integer 1:', int1);
      
      data[i]=int1;
      i=(i+1)%4;
      // Further processing or use of these integer values
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw gridlines
      ctx.strokeStyle = COLOR_GRIDLINE;
      ctx.beginPath();
      ctx.moveTo(plotter_pivot_x, 0);
      ctx.lineTo(plotter_pivot_x, plotter_height);
      ctx.stroke();
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
        ctx.fillRect(i * bar_width, plotter_pivot_y, bar_width - 10, bar_height);
        ctx.strokeRect(i * bar_width, plotter_pivot_y, bar_width - 10, bar_height);
        
        // Display number on top of each bar
        ctx.fillStyle = COLOR_TEXT;
        ctx.fillText(data[i], i * bar_width + bar_width / 2, plotter_pivot_y + bar_height - 10);
      }

      // Log array data
      console.log("Array Data:", data);
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
