var express = require('express');
var router = express.Router();
var SensorData = require('../models/sensorData');
var Device = require('../models/device');

router.post('/store', function(req, res) {

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
