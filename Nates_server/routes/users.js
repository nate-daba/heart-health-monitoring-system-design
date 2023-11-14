var express = require('express');
var router = express.Router();
var User = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signUp', function(req, res){
  console.log(req.body);
  var email = req.body.email;
  var password = req.body.password;
  const newUser = new User({
      email: email,
      passwordHash: password
  });

  // Save the new user to the database
  newUser.save()
      .then(data => {
          console.log(`${req.body.email} has been saved`);
          // After saving the user, attempt to log into the Particle cloud
          const axios = require('axios');
          const params = new URLSearchParams();
          params.append('client_id', 'particle');
          params.append('client_secret', 'particle');
          params.append('expires_in', 3600);
          params.append('grant_type', 'password');
          params.append('password', password);
          params.append('username', email);
          
          return axios.post('https://api.particle.io/oauth/token', params);
      })
      .then(response => {
          // Particle cloud responded successfully
          console.log('Particle cloud response:', response.data);
          res.status(201).json({
              message: 'User saved and Particle cloud login successful',
              access_token: response.data.access_token
          }); // Send a response to the client
      })
      .catch(err => {
          // Either saving the user or logging into Particle cloud failed
          console.log(err);
          if (!res.headersSent) {
              res.status(500).json({message: 'Error processing your request'});
          }
      });
});

module.exports = router;
