const { MongoClient } = require('mongodb');
let _db = null;

connect = async (mongoURL, databaseName) => {
    const client = new MongoClient(mongoURL);
    try {
        await client.connect();
        console.log('Connect to MongDB');
        const db = client.db(databaseName);
        _db = db;
        return db;
    } catch (error) {
        console.error('Error connecting to MongDB', error);
        throw error;
    }
}

getDB = () => {
    return _db;
}

module.exports = { 
    connect, getDB 
};