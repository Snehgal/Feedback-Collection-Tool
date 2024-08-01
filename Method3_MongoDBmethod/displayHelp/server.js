require('dotenv').config({ path: "../.env" });

const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = 4000;

const uri = process.env.MONGODB_URI;
const dbName = 'ResponseLogging';

app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));

let db;

async function connectToMongoDB() {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    try {
        await client.connect();
        db = client.db(dbName);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB", error);
        throw error;
    }
}

function toIST(date) {
    // Convert UTC date to IST (UTC+5:30)
    const istOffset = 5 * 60 + 30; // IST is UTC+5:30
    return new Date(date.getTime() + istOffset * 60 * 1000);
}

app.get('/', async (req, res) => {
  try {
      const currentTime = toIST(new Date());
      console.log('Current date and time in IST:', currentTime.toISOString());

      // Get ongoing schedules
      const ongoingSchedules = await db.collection('Schedule').find({
          startTime: { $lte: currentTime },
          endTime: { $gte: currentTime }
      }).toArray();

      console.log('Ongoing schedules:', ongoingSchedules);

      if (ongoingSchedules.length === 0) {
          console.log('No ongoing schedules found.');
      }

      // Extract labNumbers and labIDs
      const ongoingLabNumbers = ongoingSchedules
          .map(schedule => ({
              labID: schedule.labID,
              labNumber: schedule.labNo
          }))
          .sort((a, b) => {
              // Extract numeric part for sorting
              const labNumberA = a.labNumber.match(/\d+$/);
              const labNumberB = b.labNumber.match(/\d+$/);

              if (labNumberA && labNumberB) {
                  return parseInt(labNumberA[0], 10) - parseInt(labNumberB[0], 10);
              }

              return a.labNumber.localeCompare(b.labNumber);
          }); // Sort room numbers

      console.log('Sorted lab numbers:', ongoingLabNumbers);

      res.render('index', { labs: ongoingLabNumbers });

  } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send(error);
  }
});

app.get('/lab/:labID', async (req, res) => {
  const { labID } = req.params;
  try {
      const helps = await db.collection('Helps').find({
          labID: labID,
          helpEnded: { $exists: false }
      }).toArray();

      // Convert helpStarted to IST for the specific lab
      const helpsInIST = helps.map(help => ({
          ...help,
          helpStarted: toIST(help.helpStarted) // Convert helpStarted to IST
      }));

      console.log('Helps for labID:', labID, helpsInIST);

      // Extract labNumber if needed or ensure labNumber is included in helps data
      // Example labNumber assignment
      const lab = await db.collection('Schedule').findOne({ labID: labID });
      const labNumber = lab ? lab.labNo : 'Unknown Lab Number';

      res.render('lab', { labNumber, helps: helpsInIST });
  } catch (error) {
      console.error("Error fetching helps:", error);
      res.status(500).send(error);
  }
});


// Connect to MongoDB and start the server
connectToMongoDB().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}).catch(error => {
    console.error("Failed to start server due to MongoDB connection error", error);
});

// to run
// cd D:\Chirag\VSCode\GITI\Method3_MongoDBmethod\displayHelp       
// node server.js