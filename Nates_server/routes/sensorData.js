var express = require('express');
var router = express.Router();
var SensorData = require('../models/sensorData');
var Device = require('../models/device');
var AccessToken = require('../models/accessToken');
const axios = require('axios');
const qs = require('qs');

router.post('/store', async function(req, res) {

    console.log(req.body);

    // Parse the JSON string in req.body.data into an object
    let sensorDataObj;
    try {
        sensorDataObj = JSON.parse(req.body.data);
    } catch (e) {
        console.error("Error parsing JSON:", e);
        return res.status(400).json({ message: "Bad request: JSON data is malformed." });
    }

    // Now you can use sensorDataObj to access heartrate and spo2
    const newData = new SensorData({
        eventName: req.body.event,
        data: {
            heartrate: sensorDataObj.heartrate,
            spo2: sensorDataObj.spo2
        },
        deviceId: req.body.coreid,
        published_at: new Date(req.body.published_at)
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

router.get('/read/:span', async function(req, res) {
    const span = req.params.span;

    // Check if the deviceId and selectedDate query parameters are provided
    if (!req.query.deviceId || !req.query.selectedDate) {
        return res.status(400).json({ message: "Bad request: Both device ID and selected date are required." });
    }

    try {
        const deviceId = req.query.deviceId;
        const selectedDate = new Date(req.query.selectedDate); // Parse the selected date string into a Date object

        if (span === 'day') {
            // Fetch data for the specified date only
            const startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0); // Set time to midnight

            const endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999); // Set time to end of the day

            const sensorDocs = await SensorData.find({
                deviceId: deviceId,
                published_at: {
                    $gte: startDate,
                    $lte: endDate
                }
            });

            if (sensorDocs.length === 0) {
                return res.status(404).json({ message: "No data found for the provided Device ID and selected date." });
            }

            console.log('Data retrieved successfully:', sensorDocs);
            res.status(200).json(sensorDocs); // Use 200 OK for a successful operation
        } else if (span === 'week') {
            // Fetch data for the last 7 days
            console.log('fetching data for the last 7 days')
            const endDate = new Date();
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6); // Calculate the start date for the last 7 days
            console.log('start date', startDate, 'end date', endDate)
            const sensorDocs = await SensorData.find({
                deviceId: deviceId,
                published_at: {
                    $gte: startDate,
                    $lte: endDate
                }
            });

            if (sensorDocs.length === 0) {
                return res.status(404).json({ message: "No data found for the provided Device ID and the last 7 days." });
            }

            console.log('Data retrieved successfully:', sensorDocs);
            res.status(200).json(sensorDocs); // Use 200 OK for a successful operation
        } else {
            return res.status(400).json({ message: "Bad request: Invalid 'span' parameter. Use 'day' or 'week'." });
        }
    } catch (err) {
        console.error("An error occurred while retrieving data:", err);

        // If this is a known error type, you can handle it accordingly
        if (err.name === 'CastError') {
            return res.status(400).json({ message: "Bad request: Invalid Device ID format." });
        }

        // For other types of errors, return a 500 Internal Server Error
        res.status(500).json({ message: "An error occurred while retrieving data." });
    }
});


module.exports = router;
