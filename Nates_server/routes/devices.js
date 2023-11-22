var express = require('express');
var router = express.Router();
var Device = require('../models/device');
const axios = require('axios');
const qs = require('qs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// This route attaches a device to a user account
router.post('/register', async function(req, res){
  try {
    // Destructure the body for better readability
    const { deviceId, email } = req.body;

    // Validate the input
    if (!deviceId || !email) {
      return res.status(400).json({ message: 'Bad request: Device ID and email are required.' });
    }

    // Check if the device is already registered to another user
    const existingDevice = await Device.findOne({ deviceId: deviceId });
    if (existingDevice) {
      if (existingDevice.email !== email) {
        return res.status(409).json({ message: 'Conflict: Device already registered to another user.' });
      } else {
        // If you want to indicate that the same user is trying to register the device again
        return res.status(409).json({ message: 'Conflict: Device already registered to this user.' });
      }
    }


    // Initialize the new device
    var newDevice = new Device({
      deviceId: deviceId,
      email: email
    });

    // Save the new device to the database
    await newDevice.save();

    // Send a 201 response if the device is successfully saved
    res.status(201).json({ message: 'Device registered successfully.' });

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


// create route for retrieving devices for a user with a given email
router.get('/read', async function(req, res) {
  console.log('email received at backend', req.query)
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

module.exports = router;
