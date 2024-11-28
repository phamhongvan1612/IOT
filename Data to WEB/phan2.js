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

// Endpoint to count LED3 actions
appData.get('/api/countled3', (req, res) => {
    const query = `
        SELECT COUNT(*) AS count FROM led
        WHERE Device = 'Led3' AND Action = 'ON';
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error querying database for LED3:', err); // Log error for debugging
            return res.status(500).json({ error: 'Database error while querying LED3' }); // Return error message
        }

        // Check if results are valid and return count
        if (results && results.length > 0) {
            return res.json({ count: results[0].count }); // Send back the count
        } else {
            return res.json({ count: 0 }); // Return 0 if no results
        }
    });
});

// Endpoint to count LED4 actions
appData.get('/api/countled4', (req, res) => {
    const query = `
        SELECT COUNT(*) AS count FROM led
        WHERE Device = 'Led4' AND Action = 'ON';
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error querying database for LED4:', err); // Log error for debugging
            return res.status(500).json({ error: 'Database error while querying LED4' }); // Return error message
        }

        // Check if results are valid and return count
        if (results && results.length > 0) {
            return res.json({ count: results[0].count }); // Send back the count
        } else {
            return res.json({ count: 0 }); // Return 0 if no results
        }
    });
});

// API to get the current state of LEDs (ON/OFF)
appData.get('/api/ledState', (req, res) => {
    const query = `
        (
            SELECT Device, Action 
            FROM led 
            WHERE Device = 'Led3' 
            ORDER BY Time DESC 
            LIMIT 1
        )
        UNION
        (
            SELECT Device, Action 
            FROM led 
            WHERE Device = 'Led4' 
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
    console.log(`Data server running on http://localhost:${dataPort}`);
});

// MQTT LED Control App on port 5000
const appMQTT = express();
const mqttPort = 5000;

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

// Topic to control LEDs
const controlLedTopic = 'ControlLED';

// API endpoint to control LEDs
appMQTT.get('/Led/:ledId/:state', (req, res) => {
    const { ledId, state } = req.params;
    let message = '';

    // Determine the message format based on LED ID and state
    if (ledId === 'led3') {
        message = state === 'on' ? 'led3_1' : 'led3_0';
    } else if (ledId === 'led4') {
        message = state === 'on' ? 'led4_1' : 'led4_0';
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
