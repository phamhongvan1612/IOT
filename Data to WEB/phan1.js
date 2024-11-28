const express = require('express');
const mysql = require('mysql2');
const mqtt = require('mqtt');
const cors = require('cors');

// Create two separate Express applications
const appData = express();
const appMQTT = express();
const dataPort = 3000; // Port for data retrieval (MySQL)
const mqttPort = 8000; // Port for MQTT-based LED control

// Enable CORS for data app
appData.use(cors());

// MySQL connection configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '16122003',
    database: 'mqtt_data'
});

// Connect to MySQL and log any errors
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});

// MQTT connection details
const mqttServer = 'mqtt://172.20.10.5:2003';
const mqttOptions = {
    username: 'user',
    password: '0123456789'
};

// Connect to the MQTT broker
const client = mqtt.connect(mqttServer, mqttOptions);

client.on('connect', () => {
    console.log('Connected to MQTT broker');
});

// MQTT topic to control LEDs
const controlLedTopic = 'ControlLED';

// API endpoint to control LEDs on the MQTT app
appMQTT.get('/led/:ledId/:state', (req, res) => {
    const { ledId, state } = req.params;
    let message = '';

    // Determine the message format based on LED ID and state
    if (ledId === 'led1') {
        message = state === 'on' ? 'led1_1' : 'led1_0';
    } else if (ledId === 'led2') {
        message = state === 'on' ? 'led2_1' : 'led2_0';
    } else {
        return res.status(400).json({ message: 'Invalid LED ID' });
    }

    // Publish the message to the controlLedTopic
    client.publish(controlLedTopic, message);
    res.json({ message: `LED ${ledId} turned ${state}` });
});

// API endpoint to fetch the latest 10 sensor data entries on the data app
appData.get('/api/data', (req, res) => {
    const query = 'SELECT * FROM datasensor ORDER BY Time DESC LIMIT 10';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching sensor data:', err);
            res.status(500).json({ error: 'Error fetching sensor data' });
            return;
        }
        res.json(results);
    });
});

// Endpoint to fetch data for the first table on the data app
appData.get('/api/data1', (req, res) => {
    const query = 'SELECT ID, Temperature, Humidity, Light, Time FROM datasensor';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data for table 1:', err);
            res.status(500).json({ error: 'Error fetching data for table 1' });
            return;
        }
        res.json(results);
    });
});

// Endpoint to fetch data for the second table on the data app
appData.get('/api/data2', (req, res) => {
    const query = 'SELECT ID, Device, Action, Time FROM devices';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data for table 2:', err);
            res.status(500).json({ error: 'Error fetching data for table 2' });
            return;
        }
        res.json(results);
    });
});

// API to get the current state of LEDs (ON/OFF)
appData.get('/api/ledState', (req, res) => {
    const query = `
        (
            SELECT Device, Action 
            FROM devices
            WHERE Device = 'Led1' 
            ORDER BY Time DESC 
            LIMIT 1
        )
        UNION
        (
            SELECT Device, Action 
            FROM devices 
            WHERE Device = 'Led2' 
            ORDER BY Time DESC 
            LIMIT 1
        );
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error querying LED states:', err);
            return res.status(500).json({ error: 'Database error while querying LED states' }); // Return error message
        }

        // Format the result into a more useful structure (mapping device to its action)
        const states = results.reduce((acc, row) => {
            acc[row.Device.toLowerCase()] = row.Action.toLowerCase() === 'on';
            return acc;
        }, {});

        res.json(states); // Send the current state of LEDs as a JSON response
    });
});

// Start the data server
appData.listen(dataPort, () => {
    console.log(`Data server running at http://localhost:${dataPort}`);
});

// Start the MQTT control server
appMQTT.listen(mqttPort, () => {
    console.log(`MQTT control server running at http://localhost:${mqttPort}`);
});
