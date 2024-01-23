const express = require('express');
const cors = require('cors');
const userRoutes = require("./users");
const app = express();
const { connect } = require('./mongoUtil');
const { ObjectId } = require("mongodb");
const { authenticateToken } = require('./middlewares');
const port = 3000;
app.use(express.json());
app.use(cors());
require("dotenv").config();

main = (async () => {
    try {
        const db = await connect(process.env.MONGO_URL, process.env.DB_NAME);
        console.log('Connected to MongDB');
        app.get('/', (req,res) => {
            res.send('Hello World!');
        });

        app.post('/busstop', async (req, res) => {
            try {
                const { BusStopCode, RoadName, Description, Latitude, Longitude, BusServiceNo } = req.body;
                if ( !BusStopCode || !RoadName || !Description || !Latitude || !Longitude || !BusServiceNo) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }
                const newBusStop = { BusStopCode, RoadName, Description, Latitude, Longitude };
                const newBusService = { BusStopCode, BusServiceNo };
                let result = await db.collection('bus_service').insertOne(newBusService)
                result = await db.collection('bus_stop').insertOne(newBusStop);
                res.status(201).json(result);
            } catch (error) {
                res.status(500).json({ message: 'Error adding new bus stop', error: error.message });
            }
        });

        app.get('/busstop', async (req, res) => {
            try {
                const busStops = await db.collection('bus_stop').find({}).toArray();
                const busServices = await db.collection('bus_service').find({}).toArray();
                for(const busStop of busStops) {
                    const busStopCode = busStop.BusStopCode;
                    for (const busService of busServices) {
                      if ( busService.BusStopCode == busStopCode ) {
                        busStop['BusServiceNo'] = busService.BusServiceNo;
                      }
                    }
                }
                res.json(busStops);
            } catch (error) {
                res.status(500).json({ message: 'Error fetching bus stops', error: error.message });
            }
        });

        app.get('/busstop/:id', async (req, res) => {
            try {
                const id = new ObjectId(req.params.id);
                const busStop = await db.collection('bus_stop').findOne({_id: id});
                const busServices = await db.collection('bus_service').find({}).toArray();
                if (busStop) {
                    const busStopCode = busStop.BusStopCode;
                    for (let i = 0; i < busServices.length; i++) {
                        if ( busServices[i].BusStopCode == busStopCode ) {
                        busStop['BusServiceNo'] = busServices[i].BusServiceNo;
                        break;
                        }
                    }
                    res.json({busStop});
                } else {
                    res.status(404).json({ message: 'Bus stop not found' });
                }
            } catch (error) {
                res.status(500).json({ message: 'Error fetching bus stop', error: error.message });
            }
        });

        app.put('/busstop/:id', async (req, res) => {
            try {
                const busStopId = new ObjectId(req.params.id);
                const { BusStopCode, RoadName, Description, Latitude, Longitude, BusServiceNo } = req.body;
                if ( !BusStopCode || !Latitude || !Longitude || !BusServiceNo || !Array.isArray(BusServiceNo) || BusServiceNo.length === 0) {
                    return res.status(400).json({ message: 'Bus stop code, Latitude, Longitude, Bus service number are required, and bus service should be a non-empty array.' });
                }
                const oldBusStop = await db.collection('bus_stop').findOne({_id: busStopId});
                const oldBusService = await db.collection('bus_service').findOne({BusStopCode: oldBusStop.BusStopCode});
                const busServiceId = oldBusService._id;
                const updateBusStop = { BusStopCode, RoadName, Description, Latitude, Longitude };
                const updateBusService = { BusStopCode, BusServiceNo};
                let result = await db.collection('bus_stop').updateOne(
                    { _id: busStopId },
                    { $set: updateBusStop }
                );
                let updateResult = [];
                if (result.modifiedCount === 0) {
                    updateResult.push(0);
                } else {
                    updateResult.push(1);
                }
                result = await db.collection('bus_service').updateOne(
                    { _id: busServiceId },
                    { $set: updateBusService }
                );
                if (result.modifiedCount === 0) {
                    updateResult.push(0);
                } else {
                    updateResult.push(1);
                }
                if (updateResult[0] === 0 || updateResult[1] === 0) {
                    return res.status(404).json({ message: 'No bus stop found with this ID, or no new data provided' });
                }
                res.json({ message: 'Bus stop updated successfully' });
            } catch (error) {
                res.status(500).json({ message: 'Error updating bus stop', error: error.message });
            }
        });

        app.delete('/busstop/:id', async (req, res) => {
            try {
                const busStopId = new ObjectId(req.params.id);
                const busStop = await db.collection('bus_stop').findOne({_id: busStopId});
                if (!busStop) {
                    res.status(404).json({ message: 'Bus stop not found' });
                } else {
                    const busService = await db.collection('bus_service').findOne({BusStopCode: busStop.BusStopCode});
                    const busServiceId = busService._id;
                    let result = await db.collection('bus_stop').deleteOne({
                        '_id': new ObjectId(busStopId)
                    });
                    result = await db.collection('bus_service').deleteOne({
                        '_id': new ObjectId(busServiceId)
                    });
                    res.json({ message: `Bus stop: ${busStop.BusStopCode} deleted successfully`, result: result });
                }
            } catch (error) {
                res.status(500).json({ message: 'Error deleting bus stop', error: error.message });
            } 
        });

        // register the user routes
        // if the url sent to Express starts with '/users',
        // then the remaining framgent is looked for inside
        // userRoutes
        app.use('/users', userRoutes);
        
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
})();