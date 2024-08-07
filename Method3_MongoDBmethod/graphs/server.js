const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const app = express();
require('dotenv').config({ path: "../.env" });

const uri = process.env.MONGODB_URI; // Use environment variable for URI
const dbName = 'ResponseLogging';
let db;

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function connectDB() {
    try {
        await client.connect();
        db = client.db(dbName);
        app.listen(3000, () => {
            console.log('Server is running on http://localhost:3000');
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1); // Exit process with failure
    }
}

connectDB();

app.get('/', async (req, res) => {
    try {
        const rooms = await db.collection('Schedule').distinct('labNo');
        const courses = await db.collection('Schedule').distinct('labID');
        const batches = [...new Set(courses.map(course => course.split('-')[1]))];
        const labs = [...new Set(courses.map(course => course.split('-')[2]))];

        res.render('index', { rooms, courses, batches, labs });
    } catch (error) {
        console.error('Error fetching data for main page:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/data', async (req, res) => {
    try {
        const { room, course, batch, lab } = req.query;

        // Initialize counters
        let trues = 0;
        let falses = 0;
        let resolves = 0;
        let unresolves = 0;

        // Function to get room number from schedule
        async function getRoomNumber(labID) {
            const schedule = await db.collection('Schedule').findOne({ labID: labID });
            return schedule ? schedule.labNo : null;
        }

        // Helper function to process data
        async function processCursor(cursor, db) {
            const docs = await cursor.toArray();
            for (const doc of docs) {
                const [docCourse, docBatch, docLab] = doc.labID.split('-');
                const roomNumber = await getRoomNumber(doc.labID);

                const isCourseMatch = !course || docCourse === course;
                const isBatchMatch = !batch || docBatch === batch;
                const isLabMatch = !lab || docLab === lab;
                const isRoomMatch = !room || roomNumber === room;

                if (isCourseMatch && isBatchMatch && isLabMatch && isRoomMatch) {
                    if (db === 'Helps') {
                        // Increment resolves if helpEnded exists
                        if (doc.helpEnded) {
                            resolves++;
                        } else {
                            unresolves++;
                        }
                    } else if (db === 'UnresolvedHelps') {
                        // Increment unresolves for UnresolvedHelps
                        unresolves++;
                    } else { // db === 'Responses'
                        // Increment true or false responses
                        if (doc.response) {
                            trues++;
                        } else {
                            falses++;
                        }
                    }
                }
            }
        }

        // Clear previous values to avoid residual data
        trues = 0;
        falses = 0;
        resolves = 0;
        unresolves = 0;

        // Process Responses
        const responsesCursor = db.collection('Responses').find({});
        await processCursor(responsesCursor, 'Responses');

        // Process Helps
        const helpsCursor = db.collection('Helps').find({});
        await processCursor(helpsCursor, 'Helps');

        // Process UnresolvedHelps
        const unresolvedHelpsCursor = db.collection('UnresolvedHelps').find({});
        await processCursor(unresolvedHelpsCursor, 'UnresolvedHelps');

        // Send response
        console.log("Requests:", room, course, batch, lab);
        console.log("Response:", trues, falses, resolves, unresolves);
        res.json({
            positiveResponses: trues,
            negativeResponses: falses,
            resolvedHelps: resolves,
            unresolvedHelps: unresolves
        });
    } catch (error) {
        console.error('Error processing data:', error);
        res.status(500).send('Internal Server Error');
    }
});





// Handle 404 errors
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

// Handle other types of errors
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).send('Internal Server Error');
});
