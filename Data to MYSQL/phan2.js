const mqtt = require('mqtt');
const mysql = require('mysql2');

// MQTT Broker Information
const mqttServer = 'mqtt://172.20.10.5:2003';
const mqttOptions = {
    username: 'user',
    password: '0123456789'
};
const MQTT_TOPIC = 'StatusLED'; // Chỉ đăng ký topic liên quan đến LED

// MySQL Configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '16122003',
    database: 'othersensor'
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

// Subscribe to MQTT Topic
client.on('connect', () => {
    console.log('Connected to MQTT Broker');
    client.subscribe(MQTT_TOPIC, err => {
        if (err) {
            console.error('Error subscribing to topic:', err);
        } else {
            console.log(`Subscribed to topic: ${MQTT_TOPIC}`);
        }
    });
});

// Handle Incoming Messages for LED updates
client.on('message', (topic, message) => {
    if (topic === MQTT_TOPIC) {
        const payload = message.toString();
        console.log(`Received message on ${topic}: ${payload}`);

        try {
            const data = JSON.parse(payload);
            const { Device, Action } = data;

            if (Device && Action) {
                const query = 'INSERT INTO led (Device, Action, Time) VALUES (?, ?, NOW())';
                const values = [Device, Action];
                connection.query(query, values, (err, results) => {
                    if (err) {
                        console.error('Error inserting data into MySQL (WarningStatus):', err);
                    } else {
                        console.log('Data inserted into MySQL (WarningStatus):', results.insertId);
                    }
                });
            } else {
                console.error('Invalid WarningStatus payload: Missing Device or Action.');
            }
        } catch (err) {
            console.error('Error processing message:', err);
        }
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
