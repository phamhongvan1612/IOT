const express = require('express');
const mysql = require('mysql2');
const mqtt = require('mqtt');
const cors = require('cors');

// MySQL Data Retrieval App on port 4000
const appData = express();
const dataPort = 4000;

// Enable CORS for the data app
appData.use(cors());

// MySQL connection configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '16122003',
    database: 'othersensor'
});

// Connect to MySQL and log any errors
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});

// API endpoint to fetch the latest 10 sensor data entries
appData.get('/api/Data', (req, res) => {
    const query = 'SELECT * FROM data ORDER BY Time DESC LIMIT 10';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching sensor data:', err);
            res.status(500).json({ error: 'Error fetching sensor data' });
            return;
        }
        res.json(results);
    });
});

// Endpoint to fetch data for the first table
appData.get('/api/Data1', (req, res) => {
    const query = 'SELECT ID, Dust, Time FROM data';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data for table 1:', err);
            res.status(500).json({ error: 'Error fetching data for table 1' });
            return;
        }
        res.json(results);
    });
});

// Endpoint to fetch data for the second table
appData.get('/api/Data2', (req, res) => {
    const query = 'SELECT ID, Device, Action, Time FROM led';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data for table 2:', err);
            res.status(500).json({ error: 'Error fetching data for table 2' });
            return;
        }
        res.json(results);
    });
});

// Start the data server
appData.listen(dataPort, () => {
    console.log(`Data server running on http://localhost:${dataPort}`);
});

// MQTT LED Control App on port 5000
const appMQTT = express();
const mqttPort = 5000;

// MQTT connection details
const mqttServer = 'mqtt://192.168.55.104:2003';
const mqttOptions = {
    username: 'user',
    password: '0123456789'
};

// Connect to the MQTT broker
const client = mqtt.connect(mqttServer, mqttOptions);

client.on('connect', () => {
    console.log('Connected to MQTT broker');
});

// Topic to control LEDs
const controlLedTopic = 'ControlLED';

// API endpoint to control LEDs
appMQTT.get('/Led/:ledId/:state', (req, res) => {
    const { ledId, state } = req.params;
    let message = '';

    // Determine the message format based on LED ID and state
    if (ledId === 'led_warning') {
        message = state === 'on' ? 'led_warning_1' : 'led_warning_0';
    } else {
        return res.status(400).json({ message: 'Invalid LED ID' });
    }

    // Publish the message to the controlLedTopic
    client.publish(controlLedTopic, message);

    res.json({ message: `LED ${ledId} turned ${state}` });
});

// Start the MQTT server
appMQTT.listen(mqttPort, () => {
    console.log(`MQTT control server running at http://localhost:${mqttPort}`);
});
