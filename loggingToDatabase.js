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
// Database section

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://<username>:<password>@snehgalcluster1.w87bs85.mongodb.net/?appName=SnehgalCluster1";

let client;
let db;

async function connectToMongoDB() {
    if (!client) {
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        await client.connect();
        db = client.db("HelpResponseDB");
        console.log("Connected to MongoDB");
    }
}

async function logToHelp(value, labID, id, end) {
    const helpLoggingCollection = db.collection('HelpLogging');

    // help button on
    if (!end) {
        const helpLoggingDoc = {
            requestNumber: value,
            labID: labID,
            tableID: id,
            helpStarted: new Date()
        };
        await helpLoggingCollection.insertOne(helpLoggingDoc);
        console.log('Inserted document into HelpLogging');
    } 
    // help button off
    else {
        const latestRecord = await helpLoggingCollection.findOne(
            { labID: labID, tableID: id },
            { sort: { requestNumber: -1 } }
        );
        
        if (latestRecord) {
            await helpLoggingCollection.updateOne(
                { _id: latestRecord._id },
                { $set: { helpEnded: new Date() } }
            );
            console.log('Updated document in HelpLogging');
        } else {
            console.log('No matching record found to update');
        }
    }
}

async function logToResponse(lID,tID,value) {
    const responseLoggingCollection = db.collection('ResponseLogging');
    const responseLoggingDoc = {
        date: new Date(),
        labID: lID,
        tableID: tId,
        response: value // or false based on your logic
    };
    await responseLoggingCollection.insertOne(responseLoggingDoc);
    console.log('Inserted document into ResponseLogging');
}

// Database structure
// 2 tables
// Table 1: Help Logging -> Request Number, Table ID, Help Started, Help Ended
// Table 2: Response Logging -> Date, Lab ID, Table ID, Response (Yes,No)
// A temporary array will store the responses of each ID until the lab is complete, then it will flush the responses of those lab ID to table 2
