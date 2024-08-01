const WebSocket = require('ws');

// Create a WebSocket client
const ws = new WebSocket('ws://localhost:8080'); // Change the URL to your WebSocket server

ws.on('open', () => {
    console.log('WebSocket client: Connected to server');

    // Send 5 different data points
    const dataPoints = [
        '1001\t0', 
        '1001\t0',
        '2001\t1',
        '3002\t1',
        '4003\t0',
        '5004\t1',
        '6001\t0',
        '7002\t1',
        '8003\t0',
        '9004\t1',
        '11001\t1',
        '12002\t0',
        '13003\t1',
        '14004\t0',
        '15001\t1',
        '16002\t0',
        '17003\t1',
        '18004\t0',
        '19001\t1',
        '20002\t0',
        '21003\t1',
        '22004\t0'
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
