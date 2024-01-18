const express = require('express');
const cors = require('cors');
const app = express();
const { connectToMongoDB } = require('./db');
const { ObjectId } = require("mongodb");
const port = 3000;
app.use(express.json());
app.use(cors());


main = (async () => {
    try {
        const db = await connectToMongoDB();
        console.log('Connected to MongDB');
        app.get('/', (req,res) => {
            res.send('Hello World!');
        });

        app.post('/busstop', async (req, res) => {
            try {
                const { busStopCode, roadName, description, latitude, longitude } = req.body;
                if ( !busStopCode || !roadName || !description || !latitude || !longitude ) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }
                const newBusStop = { busStopCode, roadName, description, latitude, longitude };
                const result = await db.collection('bus_stop').insertOne(newBusStop);
                res.status(201).json(result);
            } catch (error) {
                res.status(500).json({ message: 'Error adding new bus stop', error: error.message });
            }
        });

        app.get('/busstop', async (req, res) => {
            try {
                const busstops = await db.collection('bus_stop').find({}).toArray();
                res.json(busstops);
            } catch (error) {
                res.status(500).json({ message: 'Error fetching bus stops', error: error.message });
            }
        });

        app.get('/busstop/:id', async (req, res) => {
            try {
                const id = new ObjectId(req.params.id);
                const busstop = await db.collection('bus_stop').findOne({_id: id});
                if (busstop) {
                    res.json({busstop});
                } else {
                    res.status(404).json({ message: 'Bus stop not found' });
                }
            } catch (error) {
                res.status(500).json({ message: 'Error fetching bus stop', error: error.message });
            }
        });

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
})();