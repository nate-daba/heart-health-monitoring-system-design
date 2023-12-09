var express = require('express');
var router = express.Router();
var SensorData = require('../models/sensorData');
var Device = require('../models/device');
var AccessToken = require('../models/accessToken');
const axios = require('axios');
const qs = require('qs');
const moment = require('moment-timezone');

// CREATE
router.post('/store', async function(req, res) {

    // Check if the API key is valid
    if (!req.headers['x-api-key']) {
        res.status(401).json({ message: "Unauthorized: API key is missing." });
    } 
    else if (!process.env.VALID_API_KEYS.includes(req.headers['x-api-key'])) {
        res.status(401).json({ message: "Unauthorized: API key is invalid." });
    }
    
    // Parse the JSON string in req.body.data into an object
    let sensorDataObj;
    try {
        sensorDataObj = JSON.parse(req.body.data);
    } catch (e) {
        console.error("Error parsing JSON:", e);
        return res.status(400).json({ message: "Bad request: JSON data is malformed." });
    }

    // Now you can use sensorDataObj to access heartrate, spo2, and measurementTime
    const newData = new SensorData({
        eventName: req.body.event,
        data: {
            heartrate: sensorDataObj.heartrate,
            spo2: sensorDataObj.spo2
        },
        deviceId: req.body.coreid,
        published_at: new Date(req.body.published_at),
        measurementTime: new Date(sensorDataObj.measurementTime) // Parse and store measurementTime
    });

    try {
        const data = await newData.save();
        console.log({'Incoming-data saved to db': data});
        let msgStr = `${req.body.event} from ${req.body.coreid} has been saved`;
        
        // Retrieve the access token using an async function
        const accessToken = await getAccessTokenFromParticleCloud();
        console.log('Access token retrieved:', accessToken);

        // make the POST request to blink the LED using the retrieved access token.

        // Now that data is saved, we blink the LED on the IoT device.
        let blinkData = qs.stringify({ 'arg': 'true' });
        let blinkConfig = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.particle.io/v1/devices/e00fce689a40d73e1ff0573a/flashGreenLED',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Authorization': 'Bearer ' + accessToken // 
            },
            data: blinkData
        };

        // Send the request to the IoT device
        axios.request(blinkConfig)
        .then((blinkResponse) => {
            console.log('Green LED blink command sent:', JSON.stringify(blinkResponse.data));
        })
        .catch((blinkError) => {
            console.error('Error sending LED blink command:', blinkError);
        });

        // Send the response to the client after saving the data and attempting to blink the LED
        res.status(201).json({ message: msgStr });
    
    } catch (err) {
        // Handle any errors from the whole process
        console.error('An error occurred:', err);
        res.status(500).json({ message: 'Error processing your request.' });
    }
});

// READ: Retrieve all sensor data in day or week span
router.get('/read/:span', async function(req, res) {
    const span = req.params.span;
    console.log('span', span);
    console.log('req.query', req.query);

    if (!req.query.deviceId) {
        return res.status(400).json({ message: "Bad request: Device ID is required." });
    }

    try {
        const deviceId = req.query.deviceId;
        const serverTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Dynamically get server's time zone

        if (span === 'day') {
            console.log('fetching data for the selected date');
            if (req.query.selectedDate) {
                let selectedDate = moment.tz(req.query.selectedDate, serverTimeZone);
                selectedDate.startOf('day'); // Set time to midnight

                let endDate = moment(selectedDate).endOf('day'); // Set time to end of the day

                const sensorDocs = await SensorData.find({
                    deviceId: deviceId,
                    measurementTime: {
                        $gte: selectedDate.toDate(),
                        $lte: endDate.toDate()
                    }
                });

                if (sensorDocs.length === 0) {
                    return res.status(404).json({ message: "No data found for the provided Device ID and selected date." });
                }

                console.log('Data retrieved successfully:', sensorDocs);
                res.status(200).json(sensorDocs);
            } else {
                return res.status(400).json({ message: "Bad request: 'selectedDate' query parameter is required for 'day' span." });
            }
        } else if (span === 'week') {
            console.log('fetching data for the last 7 days');
            let endDate = moment().tz(serverTimeZone);
            let startDate = moment().tz(serverTimeZone).subtract(6, 'days');

            const sensorDocs = await SensorData.find({
                deviceId: deviceId,
                measurementTime: {
                    $gte: startDate.toDate(),
                    $lte: endDate.toDate()
                }
            });

            if (sensorDocs.length === 0) {
                return res.status(404).json({ message: "No data found for the provided Device ID and the last 7 days." });
            }

            console.log('Data retrieved successfully:', sensorDocs);
            res.status(200).json(sensorDocs);
        } else {
            return res.status(400).json({ message: "Bad request: Invalid 'span' parameter. Use 'day' or 'week'." });
        }
    } catch (err) {
        console.error("An error occurred while retrieving data:", err);
        if (err.name === 'CastError') {
            return res.status(400).json({ message: "Bad request: Invalid Device ID format." });
        }
        res.status(500).json({ message: "An error occurred while retrieving data." });
    }
});

// DELETE route for sensor data
router.delete('/delete', async function(req, res) {
    const { deviceId, startDate, endDate } = req.body;

    if (!deviceId || !startDate || !endDate) {
        return res.status(400).json({ message: "Bad request: Device ID, start date, and end date are required." });
    }

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Bad request: Invalid date format." });
        }

        const result = await SensorData.deleteMany({
            deviceId: deviceId,
            measurementTime: { $gte: start, $lte: end }
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "No data found for the specified criteria." });
        }

        res.status(200).json({ message: "Data successfully deleted.", deletedCount: result.deletedCount });
    } catch (err) {
        console.error('Error during data deletion:', err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Function to retrieve an access token from the Particle Cloud API
async function getAccessTokenFromParticleCloud() {
    const currentTime = new Date();

    // Try to retrieve the current token from the database
    let tokenRecord = await AccessToken.findOne({ name: 'particleAccessToken' });

    // Check if the token exists and is still valid
    if (tokenRecord && tokenRecord.expiresAt > currentTime) {
        return tokenRecord.value;
    }

    try {
        // Request a new access token from the Particle Cloud API
        const responseToAccessTokenRequest = await axios.post('https://api.particle.io/oauth/token', qs.stringify({
            grant_type: 'password',
            username: process.env.PARTICLE_USERNAME, // Use environment variable
            password: process.env.PARTICLE_PASSWORD, // Use environment variable
            client_id: process.env.PARTICLE_CLIENT_ID, // Use environment variable
            client_secret: process.env.PARTICLE_CLIENT_SECRET // Use environment variable
          }));

        const tokenData = responseToAccessTokenRequest.data;

        // Calculate the expiration date based on the current time and the expires_in duration
        const expiresAt = new Date(currentTime.getTime() + tokenData.expires_in * 1000);

        // Update the token record in the database or create a new one if it doesn't exist
        if (tokenRecord) {
            tokenRecord.value = tokenData.access_token;
            tokenRecord.expiresAt = expiresAt;
            await tokenRecord.save();
        } else {
            tokenRecord = new AccessToken({
                name: 'particleAccessToken',
                value: tokenData.access_token,
                expiresAt: expiresAt
            });
            await tokenRecord.save();
        }

        return tokenData.access_token;
    } catch (error) {
        // Handle errors when requesting a new access token
        console.error('Error requesting new access token:', error);
        throw new Error('Failed to retrieve access token from Particle Cloud.');
    }
}

module.exports = router;
