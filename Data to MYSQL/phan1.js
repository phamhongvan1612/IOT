const mqtt = require('mqtt');
const mysql = require('mysql2');

// MQTT Broker Information
const mqttServer = 'mqtt://172.20.10.5:2003'; 
const mqttOptions = {
    username: 'user', 
    password: '0123456789'
};
const MQTT_TOPICS = ['Data', 'StatusDevice'];

// MySQL Information
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '16122003',
    database: 'mqtt_data'
};

// Connect to MySQL
const connection = mysql.createConnection(dbConfig);
connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL successfully.');
});

// Connect to MQTT Broker
const client = mqtt.connect(mqttServer, mqttOptions);

// Subscribe to MQTT Topics
client.on('connect', () => {
    console.log('Connected to MQTT Broker');
    client.subscribe(MQTT_TOPICS, err => {
        if (err) {
            console.error('Error subscribing to topics:', err);
        } else {
            console.log(`Subscribed to topics: ${MQTT_TOPICS.join(', ')}`);
        }
    });
});

// Handle Incoming Messages
client.on('message', (topic, message) => {
    const payload = message.toString();
    console.log(`Received message on ${topic}: ${payload}`);

    try {
        const data = JSON.parse(payload);

        if (topic === 'Data') {
            const { Temperature, Humidity, Light } = data;
            if (Temperature && Humidity && Light !== undefined) {
                const sql = `INSERT INTO datasensor (Temperature, Humidity, Light, Time) VALUES (?, ?, ?, NOW())`;
                const values = [Temperature, Humidity, Light];
                connection.query(sql, values, (error, results) => {
                    if (error) {
                        console.error('Error inserting data into MySQL (Data):', error);
                    } else {
                        console.log('Data inserted into MySQL (Data):', results.insertId);
                    }
                });
            } else {
                console.error('Invalid Data payload: Missing fields.');
            }
        } else if (topic === 'StatusDevice') {
            const { Device, Action } = data;
            if (Device && Action) {
                const query = 'INSERT INTO devices (Device, Action) VALUES (?, ?)';
                const values = [Device, Action];
                connection.query(query, values, (err, results) => {
                    if (err) {
                        console.error('Error inserting data into MySQL (StatusDevice):', err);
                    } else {
                        console.log('Data inserted into MySQL (StatusDevice):', results.insertId);
                    }
                });
            } else {
                console.error('Invalid StatusDevice payload: Missing device or action.');
            }
        }
    } catch (err) {
        console.error('Error processing message:', err);
    }
});

// Handle Connection Errors
client.on('error', err => {
    console.error('MQTT Connection Error:', err);
    client.end();
    connection.end();
    process.exit(1);
});

// Close MySQL Connection on Exit
process.on('SIGINT', () => {
    console.log('Disconnecting...');
    client.end();
    connection.end(err => {
        if (err) {
            console.error('Error disconnecting from MySQL:', err);
        } else {
            console.log('Disconnected from MySQL');
        }
        process.exit(0);
    });
});
