var express = require('express');
var router = express.Router();
var Device = require('../models/device');
var AccessToken = require('../models/accessToken');
var Physician = require('../models/physician');
const axios = require('axios');
const qs = require('qs');
const jwt = require("jwt-simple");
const fs = require('fs');

// Read the secret key from a file
const secret = fs.readFileSync(__dirname + '/../keys/jwtkey').toString();

// CRUD implementation for sensor data

/**
 * CREATE /register route:
 * This route is used to register a new device to a user's account. It starts by verifying the user's
 * authentication token and then decodes it to extract the user's email. It checks if the required
 * deviceId is provided in the request body. The route then makes an API call to the Particle Cloud
 * to validate the device ID. If the device ID is valid and not already registered to another user,
 * the route registers the device to the authenticated user's account and saves this information
 * in the database. It responds with appropriate status codes and messages based on the success
 * of the registration, the validity of the device ID, or other errors.
 */
router.post('/register', async function(req, res){
    try {
        // Retrieve the patient email from the token
        const token = req.headers['x-auth'];
        if (!token) {
            return res.status(401).json({ message: 'Missing X-Auth header.' });
        }
        const decoded = jwt.decode(token, secret);
        const patientEmail = decoded.patientEmail;
        
        const deviceId = req.body.deviceId;

        // Check if the deviceId and patientEmail are provided
        if (!deviceId || !patientEmail) {
            return res.status(400).json({ message: 'Bad request: Device ID and email are required.' });
        }

        // Retrieve the access token for Particle Cloud
        const accessToken = await getAccessTokenFromParticleCloud();

        // Check if the access token is retrieved
        if (!accessToken) {
            return res.status(404).json({ message: "Can not obtain access token for Particle Cloud." });
        }

        try {
            // Validate the device ID with Particle Cloud
            const responseToDeviceInfoRequest = await axios.get(`https://api.particle.io/v1/devices/${deviceId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // Check if the device ID exists on Particle Cloud
            if (responseToDeviceInfoRequest.status !== 200) {
                return res.status(404).json({ message: 'Invalid device ID: Device not found on Particle Cloud.' });
            }

            // Check if the device is already registered
            const existingDeviceDoc = await Device.findOne({ deviceId: deviceId });
            if (existingDeviceDoc) {
                if (existingDeviceDoc.patientEmail !== patientEmail) {
                    return res.status(409).json({ message: 'This device is already registered to another account.' });
                } else {
                    return res.status(409).json({ message: 'This device is already registered to your account.' });
                }
            }

            // Register the new device
            var newDeviceDoc = new Device({
                deviceId: deviceId,
                patientEmail: patientEmail,
                accessToken: accessToken,
                registeredOn: Date.now(),
            });
            
            await newDeviceDoc.save();

            // Respond with success message
            res.status(201).json({ message: 'Device registered successfully.' });
        } catch (deviceInfoError) {
            // Handle device info error
            return res.status(400).json({ message: 'Invalid device ID.', errors: deviceInfoError });
        }
    } catch (error) {
        // Handle validation and duplicate key errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Bad request: Invalid device data.', errors: error.errors });
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Bad request: Device already registered.' });
        }

        // Handle unauthorized errors
        if (error.name === 'UnauthorizedError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid credentials.' });
        }

        // Handle other errors
        res.status(500).json({ message: 'Internal server error: Unable to register device.' });
    }
});

/**
 * READ /read route:
 * This route is designed to retrieve a list of devices associated with the authenticated user.
 * The user's authentication token is first validated and then decoded to extract the user's email.
 * The route then retrieves all devices registered under this email from the database.
 * If devices are found, the route responds with the list of these devices.
 * Appropriate error messages are provided if the token is missing, no devices are found, or other errors occur.
 */
router.get('/read', async function(req, res) {
    try {
        // Validate the presence of the authentication token
        const token = req.headers['x-auth'];
        if (!token) {
            return res.status(401).json({ message: 'Missing X-Auth header.' });
        }

        // Decode the token to get the user's email
        const decoded = jwt.decode(token, secret);
        const patientEmail = decoded.patientEmail;

        // Retrieve devices associated with the authenticated user's email
        const deviceDocs = await Device.find({ patientEmail: patientEmail });

        // Check if any devices were found
        if (deviceDocs.length === 0) {
            return res.status(404).json({ message: "No devices found for the provided email." });
        }

        // Respond with the list of devices
        res.status(200).json(deviceDocs); // Use 200 OK for a successful operation

    } catch (err) {
        // Handle specific known error types
        if (err.name === 'CastError') {
            return res.status(400).json({ message: "Bad request: Invalid email format." });
        }

        // Respond with an internal server error for other cases
        res.status(500).json({ message: "An error occurred while retrieving devices." });
    }
});

/**
 * READ /physicianRead route:
 * This route is responsible for retrieving a list of devices associated with a given physician email.
 * It starts by validating the physician's authentication token and then decodes it to get the physician's email.
 * It verifies the existence of the physician and then retrieves devices associated with the specified user email,
 * which is passed as a query parameter.
 * The route responds with the list of devices if found, or appropriate error messages if the physician is not found,
 * no devices are associated with the user email, or other errors occur.
 */
router.get('/physicianRead', async function(req, res) {
    try {
        // Validate the authentication token
        const token = req.headers['x-auth'];
        if (!token) {
            return res.status(401).json({ message: 'Missing X-Auth header.' });
        }

        // Decode the token to get the physician's email
        const decoded = jwt.decode(token, secret);
        const physicianEmail = decoded.physicianEmail;

        // Verify the existence of the physician
        const physicianDoc = await Physician.findOne({ email: physicianEmail });
        if (!physicianDoc) {
            return res.status(404).json({ message: "Physician not found." });
        }

        // Retrieve devices associated with the specified user email
        const deviceDocs = await Device.find({ patientEmail: req.query.email });

        // Check if any devices were found
        if (deviceDocs.length === 0) {
            return res.status(404).json({ message: "No devices found for the provided email." });
        }

        // Respond with the list of devices
        res.status(200).json(deviceDocs); // Use 200 OK for a successful operation

    } catch (err) {
        // Handle specific known error types
        if (err.name === 'CastError') {
            return res.status(400).json({ message: "Bad request: Invalid email format." });
        }

        // Respond with an internal server error for other cases
        res.status(500).json({ message: "An error occurred while retrieving devices." });
    }
});

/**
 * UPDATE /update route:
 * This route is responsible for updating the details of a specific device.
 * The route first validates the user's authentication token and then checks whether the required deviceId
 * is provided in the request body. It verifies the existence of the device and the authorization
 * of the user (either the patient or their physician) to update the device.
 * The route updates the device with the new values provided in the request body and ensures
 * that the device is currently online before applying any updates.
 * If successful, it responds with a message confirming the update.
 */
router.put('/update', async function(req, res) {
    try {
        // Validate the authentication token
        const token = req.headers['x-auth'];
        if (!token) {
            return res.status(401).json({ message: 'Missing X-Auth header.' });
        }

        // Decode the token to get the user's email
        const decoded = jwt.decode(token, secret);
        const patientEmail = decoded.patientEmail;

        // Check if the deviceId is provided in the request body
        if (!req.body.deviceId) {
            return res.status(400).json({ message: "Bad request: Device ID is required." });
        }

        // Find the device by deviceId
        const device = await Device.findOne({ deviceId: req.body.deviceId });

        // Check if the device exists
        if (!device) {
            return res.status(404).json({ message: "Device not found." });
        }

        // Verify authorization for the user to access the device
        if (device.patientEmail !== patientEmail) {
            const physicianEmail = decoded.physicianEmail;
            const physicianDoc = await Physician.findOne({ email: physicianEmail });
            if (!physicianDoc) {
                return res.status(401).json({ message: "Unauthorized: Email not authorized to access this device." });
            }
        }

        // Check if the device is online before applying updates
        const accessToken = await getAccessTokenFromParticleCloud();
        const deviceInfoResponse = await axios.get(`https://api.particle.io/v1/devices/${req.body.deviceId}/?access_token=${accessToken}`);
        if (!deviceInfoResponse.data.online) {
            return res.status(400).json({ message: "Device is offline. Please try again later." });
        }

        // Prepare the update data by excluding non-updatable fields
        const updateData = req.body;
        delete updateData.deviceId; // Exclude deviceId from updateData
        
        // Apply the updates to the device document
        for (const key in updateData) {
            if (updateData.hasOwnProperty(key)) {
                device[key] = updateData[key];
            }
        }

        

        // Send parameter update requests to the device for specific fields
        for (const key in updateData) {
            if (updateData.hasOwnProperty(key)) {
                var parameterValue, cloudFunctionName;
                if (key === 'measurementFrequency') {
                    parameterValue = String(updateData[key]);
                    cloudFunctionName = 'updateMeasurementPeriod';
                } else if (key === 'timeOfDayRangeOfMeasurements') {
                    var timeObject = {"startTime": updateData[key].startTime, "endTime": updateData[key].endTime};
                    parameterValue = JSON.stringify(timeObject);
                    cloudFunctionName = 'updateMeasurementTimeofDay';
                }

                var success = await sendParmeterUpdateRequestToDevice(device.deviceId, parameterValue, cloudFunctionName);
                if (!success) {
                    return res.status(400).json({ message: "Parameter update failed." });
                }
            }
        }

        // Save the updated device
        await device.save();

        // Respond with success message and the updated device information
        res.status(200).json({ message: "Device updated successfully.", device: device });

    } catch (err) {

        // Handle validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation error: " + err.message });
        }

        // Respond with an internal server error for other cases
        res.status(500).json({ message: "An error occurred while updating the device." });
    }
});

/**
 * DELETE /delete/:deviceId route:
 * This route is responsible for deleting a specific device identified by its deviceId.
 * It starts by validating the user's authentication token and extracting the user's email.
 * Then, it retrieves the device using the provided deviceId and checks if the device is registered
 * under the user's email. If the user is authorized, it proceeds to delete the device.
 * It responds with appropriate status codes based on whether the deletion was successful,
 * the device was not found, or if other errors occur.
 */
router.delete('/delete/:deviceId', async function(req, res) {
    try {
        const token = req.headers['x-auth'];
        if (!token) {
            return res.status(401).json({ message: 'Missing X-Auth header.' });
        }
        // Decode the token to get the user's email
        const decoded = jwt.decode(token, secret);
        const patientEmail = decoded.patientEmail;

        const deviceId = req.params.deviceId;
        // Check if the device is registered to the user
        const device = await Device.findOne({ deviceId: deviceId });
        if (!device || device.patientEmail !== patientEmail) {
            return res.status(401).json({ message: "Unauthorized: Device not registered to this user." });
        }
        
        // Delete the device
        const result = await Device.deleteOne({ deviceId: deviceId });

        if (result.deletedCount === 1) {
            // Respond with no content when deletion is successful
            return res.status(204).end();
        } else {
            // Respond with not found if the device doesn't exist
            return res.status(404).json({ message: "Device not found." });
        }
    } catch (err) {
        // Handle possible errors
        if (err.name === 'CastError') {
            return res.status(400).json({ message: "Bad request: Invalid Device ID format." });
        }

        // Respond with an internal server error for other cases
        return res.status(500).json({ message: "An error occurred while deleting the device." });
    }
});

/**
 * READ /info route:
 * This route is responsible for retrieving the status of a specific device from the Particle Cloud.
 * It first validates the user's authentication token, decodes it to get the user's email,
 * and checks whether the requested deviceId is provided.
 * Then, it verifies whether the requesting user is authorized to access the device's data,
 * either as the patient associated with the device or as their physician.
 * If authorized, it retrieves the access token for the Particle Cloud and makes an API call
 * to fetch the device status and additional product information.
 * Finally, it responds with the device's information or appropriate error messages based on various conditions.
 */
router.get('/info', async function(req, res) {
    try {
        const token = req.headers['x-auth'];
        if (!token) {
            return res.status(401).json({ message: 'Missing X-Auth header.' });
        }
        // Decode the token to get the user's email
        const decoded = jwt.decode(token, secret);
        const patientEmail = decoded.patientEmail;
        
        // Check if the deviceId query parameter is provided
        if (!req.query.deviceId) {
            return res.status(400).json({ message: "Bad request: Device ID is required." });
        }

        // Retrieve the device from the database
        const device = await Device.findOne({ deviceId: req.query.deviceId });

        // Check if the device exists
        if (!device) {
            return res.status(404).json({ message: "Device not found." });
        }
        // Check if the email is either the device's email or a physician's email
        if (device.patientEmail !== patientEmail) {
            const physicianEmail = decoded.physicianEmail;
            const physicianDoc = await Physician.findOne({ email: physicianEmail });
            if (!physicianDoc) {
                // The email is neither the device's email nor a physician's email
                return res.status(401).json({ message: "Unauthorized: Email not authorized to access this device." });
            }
        }
        // Retrieve the access token from the database
        const accessToken = await getAccessTokenFromParticleCloud();
        
        // Check if the access token exists
        if (!accessToken) {
            return res.status(404).json({ message: "Device not found." });
        }

        // Retrieve the device status from the Particle Cloud
        const deviceInfoResponse = await axios.get(`https://api.particle.io/v1/devices/${req.query.deviceId}/?access_token=${accessToken}`);

        const productId = deviceInfoResponse.data.product_id;

        // Make another request to get the device name based on the product ID
        const productInfoResponse = await axios.get(`https://api.particle.io/v1/products/${productId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        // Check if the response is successful (status code 200)
        var deviceName = device.deviceName ? device.deviceName : deviceInfoResponse.data.name
        if (deviceInfoResponse.status === 200) {
            // Send the device status and device name to the client
            let data = {
                deviceName: deviceName,
                deviceStatus: deviceInfoResponse.data.online ? 'online' : 'offline',
                productName: productInfoResponse.data.product.name, // Add the product name to the response
                registeredOn: device.registeredOn,
                measurementFrequency:deviceInfoResponse.data.online ? device.measurementFrequency : 30,
                timeOfDayRangeOfMeasurements: deviceInfoResponse.data.online ? device.timeOfDayRangeOfMeasurements : {startTime: '06:00', endTime: '22:00'},
            }
            device.deviceName = deviceName;
            device.measurementFrequency = data.measurementFrequency;
            device.timeOfDayRangeOfMeasurements = data.timeOfDayRangeOfMeasurements;
            await device.save();
            return res.status(200).json({ message : data });
        } else {
            // Handle other status codes as needed
            return res.status(response.status).json({ message: "Device not found." });
        }
    } catch (err) {

            // If this is a known error type, you can handle it accordingly
            if (err.name === 'CastError') {
            return res.status(400).json({ message: "Bad request: Invalid Device ID format." });
        }

        // For other types of errors, return a 500 Internal Server Error
        res.status(500).json({ message: "An error occurred while retrieving device status." });
    }
});

/**
 * Retrieves an access token from Particle Cloud. If a valid token exists in the database,
 * it returns that token. Otherwise, it requests a new token from the Particle Cloud API,
 * updates the database with the new token, and returns it.
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

/**
 * Sends a request to a Particle Cloud device to update a specific parameter.
 * It first retrieves an access token from Particle Cloud, then sends the update request.
 * Returns true if the update is successful, false otherwise.
 *
 * @param deviceId The ID of the device to send the request to.
 * @param parameterValue The value of the parameter to be updated.
 * @param cloudFunctionName The name of the cloud function to be invoked on the device.
 */
async function sendParmeterUpdateRequestToDevice(deviceId, parameterValue, cloudFunctionName){

    const accessToken = await getAccessTokenFromParticleCloud(); // Retrieve the access token
    
    let data = qs.stringify({
        'arg': parameterValue // The parameter value to be sent
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://api.particle.io/v1/devices/${deviceId}/${cloudFunctionName}`, // URL to send the request to
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded', 
            'Authorization': 'Bearer ' + accessToken // Authorization header with the access token
        },
        data: data // Data to be sent in the request
    };

    try {
        
        const response = await axios.request(config); // Send the request to the device
        if (response.data.return_value === 1) {
            return true; // Return true if the parameter was successfully updated
        }
        else{
            return false; // Return false if the update failed
        }
    }
    catch (error) {
        return false; // Return false if there was an error in sending the request
    }
}



module.exports = router;
