const express = require('express');
const cors = require('cors');
const app = express();
const { connectToMongoDB } = require('./db');
app.use(express.json());
app.use(cors());

main = (async () => {
    try {
        const db = await connectToMongoDB();
        console.log('Connected to MongDB');
        app.get("/", function(req, res) {

        });
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
})();

app.get('/', (req,res) => {
    res.send('Hello World!');
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});