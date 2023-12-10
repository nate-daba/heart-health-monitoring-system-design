var express = require('express');
var router = express.Router();
var SensorData = require('../models/sensorData');
var Device = require('../models/device');
var AccessToken = require('../models/accessToken');
const axios = require('axios');
const qs = require('qs');
const moment = require('moment-timezone');

/**
 * CREATE /store route:
 * This route is designed to store sensor data sent from an IoT device and then trigger a response
 * on the device (like blinking an LED). It begins by validating the provided API key for security.
 * The route then parses the JSON string from the request body to extract sensor data. 
 * After successful parsing, it stores this data in the database. Once the data is saved, 
 * the route makes a request to the Particle Cloud API to trigger an LED blink on the IoT device,
 * indicating successful data reception. The route handles any errors that occur during parsing,
 * saving the data, or communicating with the Particle Cloud.
 */
router.post('/store', async function(req, res) {
    // Check if the API key is valid
    if (!req.headers['x-api-key']) {
        return res.status(401).json({ message: "Unauthorized: API key is missing." });
    } else if (!process.env.VALID_API_KEYS.includes(req.headers['x-api-key'])) {
        return res.status(401).json({ message: "Unauthorized: API key is invalid." });
    }
    
    // Parse the JSON string in req.body.data into an object
    let sensorDataObj;
    try {
        sensorDataObj = JSON.parse(req.body.data);
    } catch (e) {
        return res.status(400).json({ message: "Bad request: JSON data is malformed." });
    }

    // Create a new SensorData object with the parsed data
    const newData = new SensorData({
        eventName: req.body.event,
        data: {
            heartrate: sensorDataObj.heartrate,
            spo2: sensorDataObj.spo2
        },
        deviceId: req.body.coreid,
        published_at: new Date(req.body.published_at),
        measurementTime: new Date(sensorDataObj.measurementTime)
    });
    
    try {
        // Save the sensor data to the database
        await newData.save();
        
        let msgStr = `${req.body.event} from ${req.body.coreid} has been saved`;
        if (!req.body.test) {
            // Retrieve the access token for Particle Cloud
            const accessToken = await getAccessTokenFromParticleCloud();

            // Set up the configuration to make the POST request to blink the LED on the IoT device
            let blinkData = qs.stringify({ 'arg': 'true' });
            let blinkConfig = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `https://api.particle.io/v1/devices/${req.body.coreid}/flashGreenLED`,
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded', 
                    'Authorization': 'Bearer ' + accessToken
                },
                data: blinkData
            };

            // Send the request to blink the LED on the IoT device
            await axios.request(blinkConfig);
        }
        // Respond with a success message
        res.status(201).json({ message: msgStr });
    
    } catch (err) {
        // Handle any errors during the process
        res.status(500).json({ message: 'Error processing your request.' });
    }
});


/**
 * READ /read/:span route:
 * This route is designed to retrieve sensor data for a specific device over a specified time span,
 * either for a single day or the last week. It validates the presence of a required device ID
 * and interprets the span parameter to determine the time frame for data retrieval.
 * The route then queries the database for sensor data within the specified time frame,
 * responding with the data if found, or appropriate error messages if no data is found
 * or if other errors occur.
 */
router.get('/read/:span', async function(req, res) {

    const span = req.params.span;
    // Check if deviceId is provided
    if (!req.query.deviceId) {
        return res.status(400).json({ message: "Bad request: Device ID is required." });
    }

    try {
        const deviceId = req.query.deviceId;
        const serverTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get server's time zone

        if (span === 'day') {
            // Handling data retrieval for a single day
            if (req.query.selectedDate) {
                let selectedDate = moment.tz(req.query.selectedDate, serverTimeZone);
                console.log('ServerTimeZone', serverTimeZone)
                selectedDate.startOf('day'); // Set time to midnight

                let endDate = moment(selectedDate).endOf('day'); // Set time to end of the day
                console.log('selectedDate start date (in day span): ', selectedDate)
                console.log('selectedDate end date (in day span): ', endDate)
                // Query for sensor data within the specified day
                const sensorDocs = await SensorData.find({
                    deviceId: deviceId,
                    measurementTime: {
                        $gte: selectedDate.toDate(),
                        $lte: endDate.toDate()
                    }
                });

                // Check if any documents were found
                if (sensorDocs.length === 0) {
                    return res.status(404).json({ message: "No data found for the provided Device ID and selected date." });
                }

                res.status(200).json(sensorDocs);
            } else {
                return res.status(400).json({ message: "Bad request: 'selectedDate' query parameter is required for 'day' span." });
            }
        } else if (span === 'week') {
            // Handling data retrieval for the last 7 days
            let endDate = moment().tz(serverTimeZone);
            let startDate = moment().tz(serverTimeZone).subtract(6, 'days');
            console.log('startDate: ', startDate)
            console.log('endDate: ', endDate)
            // Query for sensor data within the last 7 days
            const sensorDocs = await SensorData.find({
                deviceId: deviceId,
                measurementTime: {
                    $gte: startDate.toDate(),
                    $lte: endDate.toDate()
                }
            });

            // Check if any documents were found
            if (sensorDocs.length === 0) {
                return res.status(404).json({ message: "No data found for the provided Device ID and the last 7 days." });
            }

            res.status(200).json(sensorDocs);
        } else {
            return res.status(400).json({ message: "Bad request: Invalid 'span' parameter. Use 'day' or 'week'." });
        }
    } catch (err) {
        
        if (err.name === 'CastError') {
            return res.status(400).json({ message: "Bad request: Invalid Device ID format." });
        }
        res.status(500).json({ message: "An error occurred while retrieving data." });
    }
});

/**
 * DELETE /delete route:
 * This route is designed to delete sensor data for a specific device within a specified time range.
 * It requires the deviceId, start date, and end date as input. The route first validates these inputs
 * and checks for their proper formatting, especially the date values. It then queries the database
 * to delete all sensor data records for the specified device that fall within the given date range.
 * The route responds with a success message and the count of deleted records if the deletion is successful,
 * or appropriate error messages if the input is invalid, no data is found for the specified criteria,
 * or other errors occur.
 */
router.delete('/delete', async function(req, res) {
    const { deviceId, startDate, endDate } = req.body;

    // Validate required input: deviceId, startDate, and endDate
    if (!deviceId || !startDate || !endDate) {
        return res.status(400).json({ message: "Bad request: Device ID, start date, and end date are required." });
    }

    try {
        // Parse and validate start and end dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Bad request: Invalid date format." });
        }

        // Delete sensor data within the specified date range for the given device
        const result = await SensorData.deleteMany({
            deviceId: deviceId,
            measurementTime: { $gte: start, $lte: end }
        });

        // Check if any documents were deleted
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "No data found for the specified criteria." });
        }

        // Respond with success message and the count of deleted records
        res.status(200).json({ message: "Data successfully deleted.", deletedCount: result.deletedCount });
    } catch (err) {
        
        res.status(500).json({ message: "Internal server error." });
    }
});

/**
 * Function: getAccessTokenFromParticleCloud
 * 
 * This function is designed to retrieve an access token from the Particle Cloud API. It first attempts to find
 * an existing token in the database and checks its validity. If the token is valid and hasn't expired, it is returned.
 * Otherwise, the function makes a request to the Particle Cloud API to generate a new access token.
 * The new token is then stored in the database with its expiration time and returned for use.
 * Any errors encountered during this process, such as failed API requests, are handled and reported.
 * 
 * @returns {Promise<string>} The access token for the Particle Cloud API.
 */
async function getAccessTokenFromParticleCloud() {
    const currentTime = new Date();

    // Try to retrieve the current token from the database
    let tokenRecord = await AccessToken.findOne({ name: 'particleAccessToken' });

    // Check if the token exists and is still valid
    if (tokenRecord && tokenRecord.expiresAt > currentTime) {
        return tokenRecord.value; // Return the existing valid token
    }

    try {
        // Request a new access token from the Particle Cloud API
        const responseToAccessTokenRequest = await axios.post('https://api.particle.io/oauth/token', qs.stringify({
            grant_type: 'password',
            username: process.env.PARTICLE_USERNAME, // Use environment variable for username
            password: process.env.PARTICLE_PASSWORD, // Use environment variable for password
            client_id: process.env.PARTICLE_CLIENT_ID, // Use environment variable for client ID
            client_secret: process.env.PARTICLE_CLIENT_SECRET // Use environment variable for client secret
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

        return tokenData.access_token; // Return the new access token

    } catch (error) {
        // Handle errors when requesting a new access token
        throw new Error('Failed to retrieve access token from Particle Cloud.');
    }
}


module.exports = router;
