//rememeber to run only when in the file .../GITI/Method3_MongoDBmethod/Website
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config({ path: '../.env' });
const app = express();
const port = 3000; // Or any port you prefer

// MongoDB connection URI
const uri = process.env.MONGODB_URI;
let client;
let db;

function toIST(date) {
    // Convert UTC date to IST (UTC+5:30)
    const istOffset = 5 * 60 + 30; // IST is UTC+5:30
    return new Date(new Date(date).getTime() + istOffset * 60 * 1000);
}

// Connect to MongoDB
async function connectToMongoDB() {
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
            await db.collection('Schedule').createIndex({ labID: 1 }); // Index on labID

        } catch (error) {
            console.error("Error connecting to MongoDB", error);
            throw error;
        }
    }
}

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the "public" directory

// Endpoint to get room numbers from "Tables"
app.get('/get-tables', async (req, res) => {
    try {
        await connectToMongoDB(); // Ensure connection is established
        const tables = db.collection('Tables');
        const result = await tables.find({}).toArray();
        res.json(result);
    } catch (error) {
        res.status(500).send('Error retrieving data');
    }
});

// Endpoint to add a record to "Schedule"
app.post('/add-schedule', async (req, res) => {
    try {
        await connectToMongoDB(); // Ensure connection is established
        const record = req.body;

        // Parse startTime and endTime as Date objects and convert to IST
        const startTimeUTC = new Date(record.startTime);
        const endTimeUTC = new Date(record.endTime);

        const startTimeIST = toIST(startTimeUTC); // Convert to IST
        const endTimeIST = toIST(endTimeUTC);     // Convert to IST

        record.startTime = startTimeIST; // Store as IST Date object
        record.endTime = endTimeIST;     // Store as IST Date object

        // Check if a record with the same labID already exists
        const existingRecord = await db.collection('Schedule').findOne({ labID: record.labID });

        if (existingRecord) {
            // If a record exists, send an error response
            res.status(400).json({ message: 'Record with this labID already exists' });
        } else {
            // If no record exists, insert the new record
            await db.collection('Schedule').insertOne(record);
            res.status(200).json({ message: 'Record added successfully!' });
        }
    } catch (error) {
        res.status(500).send('Error adding record');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
