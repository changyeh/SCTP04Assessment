const { MongoClient } = require('mongodb');
require('dotenv').config();

process.env.MONGO_RENTAL_API;

connectToMongoDB = async () => {
    const url = process.env.MONGO_URI;
    const client = new MongoClient(url);
    try {
        await client.connect();
        console.log('Connect to MongDB');
        return client.db();
    } catch (error) {
        console.error('Error connecting to MongDB', error);
        throw error;
    }
}

module.exports = { connectToMongoDB };