var express = require('express');
var router = express.Router();
var SensorData = require('../models/sensorData');
var Device = require('../models/device');

router.post('/', function(req, res) {
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

    newData.save()
        .then(data => {
            console.log({'Incoming-data saved to db': data});
            let msgStr = `${req.body.event} from ${req.body.coreid} has been saved`;
            res.status(201).json({ message: msgStr });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error saving data' });
        });
});


router.get('/read', async function(req, res) {
    // Check if the deviceId query parameter is provided
    if (!req.query.email) {
        return res.status(400).json({ message: "Bad request: user email is required." });
    }

    try {
        const deviceDocs = await Device.find({ email: req.query.email });
        // console.log('deviceDocs: ', deviceDocs);
        let deviceId = deviceDocs[0].deviceId; // this should be changed later when multiple devices are supported
        console.log('deviceId: ', deviceId);
        const sensorDocs = await SensorData.find({ deviceId: deviceId });
        
        // Check if any documents were found
        if (sensorDocs.length === 0) {
            return res.status(404).json({ message: "No data found for the provided Device ID." });
        }

        console.log('Data retrieved successfully:', sensorDocs);
        res.status(200).json(sensorDocs); // Use 200 OK for a successful operation
    } catch (err) {
        console.error("An error occurred while retrieving data:", err); // Log the error so you can inspect it in your server logs
        
        // If this is a known error type, you can handle it accordingly
        if (err.name === 'CastError') {
            return res.status(400).json({ message: "Bad request: Invalid Device ID format." });
        }

        // For other types of errors, return a 500 Internal Server Error
        res.status(500).json({ message: "An error occurred while retrieving data." });
    }
});




module.exports = router;
