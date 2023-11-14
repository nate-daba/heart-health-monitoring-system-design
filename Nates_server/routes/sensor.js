var express = require('express');
var router = express.Router();
var sensorData = require('../models/sensorData');

router.post('/', function(req, res){
    console.log(req.body);
    // res.json({message: 'Got it!'}); // This line should be removed or moved inside the .then block to avoid sending multiple responses

    const newData = new sensorData({
        eventName: req.body.event,
        heartrate: req.body.data,
        spo2: req.body.data, // need to change this later
        deviceId: req.body.coreid,
        published_at: req.body.published_at
    });

    newData.save()
        .then(data => {
            console.log({'Incoming-data': req.body})
            let msgStr = `${req.body.event} from ${req.body.data.coreid} has been saved`;
            res.status(201).json({message: msgStr});
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({message: 'Error saving data'});
        });
});

router.post('/read', function(req, res){
    console.log('hit the read route');
    console.log('deviceId: ' + req.body.deviceId)
    console.log(typeof req.body.deviceId)
    sensorData.find({deviceId: req.body.deviceId}, function (err, docs) {
        if (err){
            console.error(err); // Log the error so you can inspect it in your server logs
            res.status(500).json({message: "An error occurred while retrieving data."});
        }
        else{
            console.log('Something bad happened');
            res.status(200).json(docs); // Use 200 OK for a successful GET request
        }
    });
});


module.exports = router;
