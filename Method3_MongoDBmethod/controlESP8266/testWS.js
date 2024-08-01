const WebSocket = require('ws');

// Create a WebSocket client
const ws = new WebSocket('ws://localhost:8080'); // Change the URL to your WebSocket server

ws.on('open', () => {
    console.log('WebSocket client: Connected to server');

    // Send 5 different data points
    const dataPoints = [
        '1001\t0',  // Example data: tableID 1000, value 1
        '2001\t1',  // Example data: tableID 2000, value 2
        '3002\t1',  // Example data: tableID 3000, value 1
        '4003\t1',  // Example data: tableID 1000, value 1
        '7001\t0',  // Example data: tableID 2000, value 2
        '7003\t1',  // Example data: tableID 3000, value 1
    ];

    dataPoints.forEach((data, index) => {
        setTimeout(() => {
            ws.send(data);
            console.log(`WebSocket client: Sent message ${data}`);
        }, index * 1000); // Send each data point 1 second apart
    });
});

ws.on('message', message => {
    console.log(`WebSocket client: Received message => ${message}`);
});

ws.on('close', () => {
    console.log('WebSocket client: Connection closed');
});

ws.on('error', error => {
    console.error(`WebSocket client: Error => ${error.message}`);
});
