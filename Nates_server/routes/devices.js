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


// API doc: https://docs.particle.io/reference/cloud-apis/api/#list-devices
// router.get('/list', function(req, res){
//   let config = {
//     method: 'get',
//     maxBodyLength: Infinity,
//     url: 'https://api.particle.io/v1/devices',
//     headers: { 
//       'Authorization': 'Bearer ' + req.headers["x-auth"]
//     }
//   };
  
//   axios.request(config)
//   .then((response) => {
//     console.log(JSON.stringify(response.data));
//     res.status(201).json(response.data);
//   })
//   .catch((error) => {
//     console.log(error);
//   });
// })

module.exports = router;
