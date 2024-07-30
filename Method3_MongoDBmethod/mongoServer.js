const express = require('express');
const WebSocket = require('ws');
const app = express();
const port = 4000;
const wsIPport = "ws://192.168.1.6:81" //change IP and port
let webSocket;
let isWebSocketConnected = false;

// Set up WebSocket connection
function setupWebSocket() {
    if (!webSocket) {
        webSocket = new WebSocket(wsIPport);
        
        webSocket.onopen = () => console.log("WebSocket connected");
        webSocket.onclose = () => {
            console.log("WebSocket closed");
            webSocket = null;
            isWebSocketConnected = false;
        };
        webSocket.onmessage = async (message) => {
            console.log("Received message:", message.data);
            // Handle WebSocket message
        };
        webSocket.onerror = (error) => console.error("WebSocket error:", error);
    }
}

// Route to control WebSocket connection
app.post('/control-websocket', (req, res) => {
    const action = req.query.action; // 'connect' or 'disconnect'

    if (action === 'connect') {
        if (!isWebSocketConnected) {
            setupWebSocket();
            isWebSocketConnected = true;
            res.send('WebSocket connected');
        } else {
            res.send('WebSocket is already connected');
        }
    } else if (action === 'disconnect') {
        if (webSocket) {
            webSocket.close();
            webSocket = null;
            isWebSocketConnected = false;
            res.send('WebSocket disconnected');
        } else {
            res.send('WebSocket is not connected');
        }
    } else {
        res.status(400).send('Invalid action');
    }
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Start HTTP server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
