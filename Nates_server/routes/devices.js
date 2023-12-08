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
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// CREATE: this route attaches a device to a user account
router.post('/register', async function(req, res){
  
  try {
    // Retrieve the email from the token
    const token = req.headers['x-auth'];
    if (!token) {
        return res.status(401).json({ message: 'Missing X-Auth header.' });
    }
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;

    const deviceId = req.body.deviceId;

    // Validate the input
    if (!deviceId || !email) {
      return res.status(400).json({ message: 'Bad request: Device ID and email are required.' });
    }

    // Retrieve the access token using an async function
    const accessToken = await getAccessTokenFromParticleCloud();
    console.log('Access token retrieved:', accessToken);
    
    // Check if the access token exists
    if (!accessToken) {
      return res.status(404).json({ message: "Can not obtain access token for Particle Cloud." });
    }
    else{
      console.log('access token (in registration)', accessToken)
    }
    
    try {
      // Validate the device ID by making an API call to the Particle Cloud to get the device information
      const responseToDeviceInfoRequest = await axios.get(`https://api.particle.io/v1/devices/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Replace with your Particle Cloud access token
        },
      });

      // Check if the device ID exists on the Particle Cloud
      if (responseToDeviceInfoRequest.status !== 200) {
        return res.status(404).json({ message: 'Invalid device ID: Device not found on Particle Cloud.' });
      }

      // Check if the device is already registered to another user
      const existingDevice = await Device.findOne({ deviceId: deviceId });
      if (existingDevice) {
        if (existingDevice.email !== email) {
          return res.status(409).json({ message: 'Device already registered to another user.' });
        } else {
          // If you want to indicate that the same user is trying to register the device again
          return res.status(409).json({ message: 'Device already registered to this user.' });
        }
      }

      // Initialize the new device
      var newDevice = new Device({
        deviceId: deviceId,
        email: email,
        accessToken: accessToken,
        registeredOn: Date.now(),
      });
      // Save the new device to the database
      await newDevice.save();

      // Send a 201 response if the device is successfully saved
      res.status(201).json({ message: 'Device registered successfully.' });
    } catch (deviceInfoError) {
      console.error('Device info error:', deviceInfoError);

      // Send an appropriate error message to the client for device info error
      return res.status(400).json({ message: 'Invalid device ID.', errors: deviceInfoError });
    }
  } catch (error) {
    console.error('Registration error:', error);

    // Check for validation errors (assuming the use of Mongoose)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Bad request: Invalid device data.', errors: error.errors });
    }

    // If the error code is 11000, it indicates a duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bad request: Device already registered.' });
    }

    // Handle unauthorized errors
    if (error.name === 'UnauthorizedError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid credentials.' });
    }

    // Generic error message for other cases
    res.status(500).json({ message: 'Internal server error: Unable to register device.' });
  }
});

// READ: create route for retrieving devices for a user with a given email
router.get('/read', async function(req, res) {
  // console.log('email received at backend', req.query)

  try {
    const token = req.headers['x-auth'];
    if (!token) {
        return res.status(401).json({ message: 'Missing X-Auth header.' });
    }
    // Decode the token to get the user's email
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;
    
    // Retrieve the devices for the user with the given email
    const deviceDocs = await Device.find({ email: email });

    // Check if any documents were found
    if (deviceDocs.length === 0) {
      return res.status(404).json({ message: "No devices found for the provided email." });
    }

    console.log('Devices retrieved successfully:', deviceDocs);
    res.status(200).json(deviceDocs); // Use 200 OK for a successful operation
  } catch (err) {
    console.error("An error occurred while retrieving devices:", err); // Log the error so you can inspect it in your server logs

    // If this is a known error type, you can handle it accordingly
    if (err.name === 'CastError') {
      return res.status(400).json({ message: "Bad request: Invalid email format." });
    }

    // For other types of errors, return a 500 Internal Server Error
    res.status(500).json({ message: "An error occurred while retrieving devices." });
  }
});

// READ: create route for retrieving devices for a user with a given email
router.get('/physicianRead', async function(req, res) {
  // console.log('email received at backend', req.query)

  try {
    const token = req.headers['x-auth'];
    if (!token) {
        return res.status(401).json({ message: 'Missing X-Auth header.' });
    }
    // Decode the token to get the physician's email
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;
    
    const physician = await Physician.findOne({ email: email });
    if (!physician) {
      return res.status(404).json({ message: "Physician not found." });
    }

    // Retrieve the devices for the user with the given email
    const deviceDocs = await Device.find({ email: req.query.email });

    // Check if any documents were found
    if (deviceDocs.length === 0) {
      return res.status(404).json({ message: "No devices found for the provided email." });
    }

    console.log('Devices retrieved successfully:', deviceDocs);
    res.status(200).json(deviceDocs); // Use 200 OK for a successful operation
  } catch (err) {
    console.error("An error occurred while retrieving devices:", err); // Log the error so you can inspect it in your server logs

    // If this is a known error type, you can handle it accordingly
    if (err.name === 'CastError') {
      return res.status(400).json({ message: "Bad request: Invalid email format." });
    }

    // For other types of errors, return a 500 Internal Server Error
    res.status(500).json({ message: "An error occurred while retrieving devices." });
  }
});
// UPDATE: create route for updating a device
router.put('/update', async function(req, res) {
  console.log('req.body', req.body)
  try {
    const token = req.headers['x-auth'];
    if (!token) {
        return res.status(401).json({ message: 'Missing X-Auth header.' });
    }
    // Decode the token to get the user's email
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;
    

    // Check if the deviceId body parameter is provided
    if (!req.body.deviceId) {
      return res.status(400).json({ message: "Bad request: Device ID is required." });
    }

    // Find the device by deviceId
    const device = await Device.findOne({ deviceId: req.body.deviceId });

    // Check if the device exists
    if (!device) {
      return res.status(404).json({ message: "Device not found." });
    }
    // Check if the email is either the device's email or a physician's email
    if (device.email !== email) {
      const physician = await Physician.findOne({ email: email });
      if (!physician) {
        // The email is neither the device's email nor a physician's email
        return res.status(401).json({ message: "Unauthorized: Email not authorized to access this device." });
      }
      console.log('physician', physician)
    }
    // Update the device with new values. Exclude fields that should not be updated.
    // req.body will contain the fields you want to update.

    // Retrieve the device status from the Particle Cloud to check if the device is online
    const accessToken = await getAccessTokenFromParticleCloud();
    const deviceInfoResponse = await axios.get(`https://api.particle.io/v1/devices/${req.body.deviceId}/?access_token=${accessToken}`);

    if (!deviceInfoResponse.data.online) {
      return res.status(400).json({ message: "Device is offline. Please try again later." });
    }
    const updateData = req.body;

    // remove deviceId from updateData
    delete updateData.deviceId;

    // Apply the updates to the device document
    for (const key in updateData) {
      if (updateData.hasOwnProperty(key)) {
        device[key] = updateData[key];
      }
    }

    // Save the updated device
    await device.save();

    for (const key in updateData) {
      if (updateData.hasOwnProperty(key)) {
        if (key === 'measurementFrequency') {
          var parameterValue = String(updateData[key]);
          var cloudFunctionName = 'updateMeasurementPeriod';
        }
        if (key === 'timeOfDayRangeOfMeasurements') {
          console.log('updateData[key]', updateData[key])
          var timeObject = {"startTime":updateData[key].startTime,"endTime": updateData[key].endTime};
          var jsonString = JSON.stringify(timeObject);
          console.log('jsonString', jsonString)
          var parameterValue = jsonString;
          var cloudFunctionName = 'updateMeasurementTimeofDay';
        }
        var success = sendParmeterUpdateRequestToDevice(device.deviceId, parameterValue, cloudFunctionName);
        if (!success) {
          return res.status(400).json({ message: "Parameter update failed." })
        }
      }
    }
    res.status(200).json({ message: "Device updated successfully.", device: device });

  } catch (err) {
    console.error("An error occurred while updating the device:", err);

    // Handle possible errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error: " + err.message });
    }

    res.status(500).json({ message: "An error occurred while updating the device." });
  }
});

// DELETE: create route for deleting a device
router.delete('/delete/:deviceId', async function(req, res) {
  console.log(req.params)
  try {
    const token = req.headers['x-auth'];
    if (!token) {
        return res.status(401).json({ message: 'Missing X-Auth header.' });
    }
    // Decode the token to get the user's email
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;

    const deviceId = req.params.deviceId;
    // check if device is registered to user
    // Find the device by deviceId
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (device.email !== email) {
      return res.status(401).json({ message: "Unauthorized: Device not registered to this user." });
    }
    // Assuming authorization middleware ensures only authorized deletions
    const result = await Device.deleteOne({ deviceId: deviceId });

    if (result.deletedCount === 1) {
      // No content to send back
      return res.status(204).end();
    } else {
      // Device not found
      return res.status(404).json({ message: "Device not found." });
    }
  } catch (err) {
    console.error("An error occurred while deleting the device:", err);

    // Handle possible errors
    if (err.name === 'CastError') {
      return res.status(400).json({ message: "Bad request: Invalid Device ID format." });
    }

    // Internal Server Error for other cases
    return res.status(500).json({ message: "An error occurred while deleting the device." });
  }
});

// This route gets the device status from the Particle Cloud
router.get('/info', async function(req, res) {

  try {
    const token = req.headers['x-auth'];
    if (!token) {
        return res.status(401).json({ message: 'Missing X-Auth header.' });
    }
    // Decode the token to get the user's email
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;
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
    if (device.email !== email) {
      const physician = await Physician.findOne({ email: email });
      if (!physician) {
        // The email is neither the device's email nor a physician's email
        return res.status(401).json({ message: "Unauthorized: Email not authorized to access this device." });
      }
      console.log('physician', physician)
    }
    // Retrieve the access token from the database
    const accessToken = await getAccessTokenFromParticleCloud();
    console.log('Access token retrieved:', accessToken);
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
    console.log('product info response', productInfoResponse.data)
    
    // Check if the response is successful (status code 200)
    var deviceName = device.deviceName ? device.deviceName : deviceInfoResponse.data.name
    if (deviceInfoResponse.status === 200) {
      // Send the device status and device name to the client
      let data = {
        deviceName: deviceName,
        deviceStatus: deviceInfoResponse.data.online ? 'online' : 'offline',
        productName: productInfoResponse.data.product.name, // Add the product name to the response
        registeredOn: device.registeredOn,
        measurementFrequency: device.measurementFrequency,
        timeOfDayRangeOfMeasurements: device.timeOfDayRangeOfMeasurements,
      }
      device.deviceName = deviceName;
      await device.save();
      return res.status(200).json({ message : data });
    } else {
      // Handle other status codes as needed
      return res.status(response.status).json({ message: "Device not found." });
    }
  } catch (err) {
    console.error("An error occurred while retrieving device status:", err); // Log the error so you can inspect it in your server logs

    // If this is a known error type, you can handle it accordingly
    if (err.name === 'CastError') {
      return res.status(400).json({ message: "Bad request: Invalid Device ID format." });
    }

    // For other types of errors, return a 500 Internal Server Error
    res.status(500).json({ message: "An error occurred while retrieving device status." });
  }
});

async function getAccessTokenFromParticleCloud() {
  const currentTime = new Date();

  // Try to retrieve the current token from the database
  let tokenRecord = await AccessToken.findOne({ name: 'particleAccessToken' });

  // Check if the token exists and is still valid
  if (tokenRecord && tokenRecord.expiresAt > currentTime) {
      console.log('Access token retrieved from database:', tokenRecord.value)
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

async function sendParmeterUpdateRequestToDevice(deviceId, parameterValue, cloudFunctionName){
  const accessToken = await getAccessTokenFromParticleCloud();
  console.log('Access token retrieved:', accessToken);
  let data = qs.stringify({
    'arg': parameterValue
  });
  
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://api.particle.io/v1/devices/${deviceId}/${cloudFunctionName}`,
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded', 
      'Authorization': 'Bearer ' + accessToken //
    },
    data : data
  };

  try {
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    if (response.data.return_value === 1) {
      console.log('Parameter updated successfully.');
      return true;
    }
    else{
      console.log('Parameter update failed.');
      return false;
    }
  }
  catch (error) {
    console.log(error);
  }

}


module.exports = router;
