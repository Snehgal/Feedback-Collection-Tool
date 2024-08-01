const express = require('express');
const WebSocket = require('ws');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config({ path: "../.env" });

const app = express();
const port = 3000; // Port for the Express server
const wsPort = 8080; // Port for the WebSocket server

const uri = process.env.MONGODB_URI;
const wsIPport = `ws://localhost:${wsPort}`; // WebSocket URI

let client;
let db;
let webSocketServer;

function toIST(date) {
    // Convert UTC date to IST (UTC+5:30)
    const istOffset = 5 * 60 + 30; // IST is UTC+5:30
    return new Date(new Date(date).getTime() + istOffset * 60 * 1000);
}

async function connectToMongoDB() {
    console.log("Connecting to MongoDB...");
    if (!client) {
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        try {
            await client.connect();
            db = client.db("ResponseLogging");
            console.log("Connected to MongoDB");

            // Ensure indexes for faster lookups
            await db.collection('Tables').createIndex({ tableID: 1 }); // Index on tableID array elements
            await db.collection('Schedule').createIndex({ labNo: 1, startTime: 1, endTime: 1 }); // Index on labNo, startTime, and endTime
        } catch (error) {
            console.error("Error connecting to MongoDB", error);
            throw error;
        }
    }
}

async function getLabID(tableID) {
    try {
        tableID = parseInt(tableID / 1000, 10);
        if (isNaN(tableID)) {
            throw new Error(`Invalid tableID: ${tableID}`);
        }

        const table = await db.collection('Tables').findOne({ tableID: tableID });
        if (!table) {
            throw new Error(`No lab found for tableID: ${tableID}`);
        }

        const labNo = table._id;
        if (!labNo) {
            throw new Error(`Invalid labNo retrieved for tableID: ${tableID}`);
        }

        const currentTime = new Date();

        const schedule = await db.collection('Schedule').findOne({
            labNo: labNo,
            startTime: { $lte: toIST(currentTime) },
            endTime: { $gte: toIST(currentTime) }
        });

        if (!schedule) {
            throw new Error(`No active lab found for labNo: ${labNo}`);
        }

        return schedule.labID;

    } catch (error) {
        console.error("Error in getLabID:", error);
        throw error;
    }
}

// function setupWebSocketServer() {
//     webSocketServer = new WebSocket.Server({ port: wsPort });

//     webSocketServer.on('connection', (ws) => {
//         console.log('WebSocket connected');

//         ws.on('message', async (message) => {
//             console.log('Received message:', message.toString());

//             // Process WebSocket message
//             const values = message.toString().split('\t');
//             if (values.length !== 2) {
//                 console.error('Expected 2 values, but received:', values);
//                 return;
//             }

//             const tableID = parseInt(values[0].trim(), 10);
//             const value = parseInt(values[1].trim(), 10);

//             if (isNaN(tableID) || isNaN(value)) {
//                 console.error('One or more values could not be parsed as integers.');
//                 return;
//             }

//             try {
//                 const labID = await getLabID(tableID);
//                 if (value === 2) {
//                     await logToHelps(labID, tableID);
//                 } else {
//                     await logToResponses(labID, tableID, value);
//                 }
//             } catch (error) {
//                 console.error("Error processing message:", error);
//             }
//         });

//         ws.on('close', () => {
//             console.log('WebSocket closed');
//         });

//         ws.on('error', (error) => {
//             console.error('WebSocket error:', error);
//         });
//     });
// }

//trying website thingy
function setupWebSocketServer() {
    webSocketServer = new WebSocket.Server({ port: wsPort });
    let clients = [];

    webSocketServer.on('connection', (ws) => {
        console.log('WebSocket connected');
        clients.push(ws);

        ws.on('message', async (message) => {
            console.log('Received message:', message.toString());

            // Process WebSocket message
            const values = message.toString().split('\t');
            if (values.length !== 2) {
                console.error('Expected 2 values, but received:', values);
                return;
            }

            const tableID = parseInt(values[0].trim(), 10);
            const value = parseInt(values[1].trim(), 10);

            if (isNaN(tableID) || isNaN(value)) {
                console.error('One or more values could not be parsed as integers.');
                return;
            }

            try {
                const labID = await getLabID(tableID);
                if (value === 2) {
                    await logToHelps(labID, tableID);
                } else {
                    await logToResponses(labID, tableID, value);
                }

                // Broadcast to all clients
                const messageToSend = `tableID: ${tableID}, value: ${value}`;
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(messageToSend);
                    }
                });
            } catch (error) {
                console.error("Error processing message:", error);
            }
        });

        ws.on('close', () => {
            console.log('WebSocket closed');
            clients = clients.filter(client => client !== ws);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
}

async function logToHelps(labID, tableID) {
    const helpLoggingCollection = db.collection('Helps');
    const latestRecord = await helpLoggingCollection.findOne(
        { labID: labID, tableID: tableID },
        { sort: { helpStarted: -1 } }
    );

    if (!latestRecord || latestRecord.helpEnded) {
        const helpLoggingDoc = {
            labID: labID,
            tableID: tableID,
            helpStarted: new Date()
        };
        try {
            await helpLoggingCollection.insertOne(helpLoggingDoc);
            console.log('Inserted new document into Helps');
        } catch (error) {
            console.error("Error inserting document into Helps", error);
        }
    } else {
        try {
            await helpLoggingCollection.updateOne(
                { _id: latestRecord._id },
                { $set: { helpEnded: new Date() } }
            );
            console.log('Updated document in Helps with helpEnded');
        } catch (error) {
            console.error("Error updating document in Helps", error);
        }
    }
}

async function logToResponses(labID, tableID, value) {
    const responseLoggingCollection = db.collection('Responses');
    const responseLoggingDoc = {
        date: new Date(),
        response: value === 1
    };

    try {
        await responseLoggingCollection.updateOne(
            { labID: labID, tableID: tableID },
            { $set: responseLoggingDoc },
            { upsert: true }
        );
        console.log('Updated or inserted document into Responses');
    } catch (error) {
        console.error("Error updating or inserting document into Responses", error);
    }
}

async function emptyCollection(collectionName) {
    try {
        const collection = db.collection(collectionName);
        const result = await collection.deleteMany({});
        console.log(`Deleted ${result.deletedCount} documents from the ${collectionName} collection`);
    } catch (error) {
        console.error(`Error emptying the ${collectionName} collection`, error);
    }
}

app.use(express.static(__dirname)); // Serve static files

app.listen(port, async () => {
    console.log(`Express server running at http://localhost:${port}`);
    await connectToMongoDB();
    await emptyCollection("Helps");
    await emptyCollection("Responses");
    setupWebSocketServer();
});
