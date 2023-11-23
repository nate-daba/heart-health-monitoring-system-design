var express = require('express');
var router = express.Router();
var Device = require('../models/device');
const axios = require('axios');
const qs = require('qs');
const e = require('express');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
// CRUD operations for devices

// CREATE: this route attaches a device to a user account
router.post('/register', async function(req, res){
  try {
    // Destructure the body for better readability
    const { deviceId, email } = req.body;

    // Validate the input
    if (!deviceId || !email) {
      return res.status(400).json({ message: 'Bad request: Device ID and email are required.' });
    }

    // Retrieve the access token from the Particle Cloud
    const responseToAccessTokenRequest = await axios.post('https://api.particle.io/oauth/token', qs.stringify({
      grant_type: 'password', // The grant type you are using (e.g., 'password')
      username: 'ndaba@arizona.edu', // Your Particle Cloud username
      password: '^nDr0id1x', // Your Particle Cloud password
      client_id: 'particle', // Your Particle Cloud OAuth client ID
      client_secret: 'particle' // Your Particle Cloud OAuth client secret
    }));
    var accessToken = responseToAccessTokenRequest.data.access_token;
    // Check if the access token exists
    if (!accessToken) {
      return res.status(404).json({ message: "Can not create access token on Particle Cloud." });
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
    // Check if the email query parameter is provided
    if (!req.query.email) {
      return res.status(400).json({ message: "Bad request: user email is required." });
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

// This route gets the device status from the Particle Cloud
router.get('/info', async function(req, res) {
  try {
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

    // Retrieve the access token from the database
    const accessToken = device.accessToken;

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
    if (deviceInfoResponse.status === 200) {
      // Send the device status and device name to the client
      let data = {
        deviceName: deviceInfoResponse.data.name,
        deviceStatus: deviceInfoResponse.data.online ? 'online' : 'offline',
        productName: productInfoResponse.data.product.name, // Add the product name to the response
        registeredOn: device.registeredOn,
      }
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

module.exports = router;
