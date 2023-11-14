var express = require('express');
var router = express.Router();
var User = require('../models/device');
const axios = require('axios');
const qs = require('qs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// This route claims a device to the authenticated user

router.post('/register', function(req, res){
    console.log(req.body);

    let data = qs.stringify({
      'id': req.body.deviceId, 
    });

    let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.particle.io/v1/devices',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded', 
      'Authorization': 'Bearer ' + req.headers["x-auth"]
    },
    data: data
    };

    axios.request(config)
    .then((response) => {
      console.log('Device succesfully claimed!');
      console.log(response.data);
      res.status(201).json(response.data);
    })
    .catch((error) => {
      console.log(error);
    });

});

// API doc: https://docs.particle.io/reference/cloud-apis/api/#list-devices
router.get('/list', function(req, res){
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://api.particle.io/v1/devices',
    headers: { 
      'Authorization': 'Bearer ' + req.headers["x-auth"]
    }
  };
  
  axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
    res.status(201).json(response.data);
  })
  .catch((error) => {
    console.log(error);
  });
})

module.exports = router;
