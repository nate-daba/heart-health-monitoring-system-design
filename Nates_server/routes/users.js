var express = require('express');
var router = express.Router();
var User = require('../models/user');
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");
const fs = require('fs');

// Read the secret key from a file
const secret = fs.readFileSync(__dirname + '/../keys/jwtkey').toString();
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signUp', function(req, res){
  console.log(req.body);
  var email = req.body.email;
  var password = req.body.password;
  const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: email,
      passwordHash: password
  });

  // Save the new user to the database
  newUser.save()
      .then(data => {
          console.log(`${email} has been saved`);
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

router.post("/logIn", function (req, res) 
{
  console.log('req body: ', req.body);
  console.log('req body email: ', req.body.email);
  console.log('req body password: ', req.body.password);
  if (!req.body.email || !req.body.password) 
  {
    res.status(201).json({ sucess: false, error: "Missing email and/or password", req: req.body});
    return;
  }
  // Get user from the database
  User.findOne({ email: req.body.email })
    .then(user => {
        if (!user) {
            // Username not in the database
            res.status(201).json({ success: false, error: "Login failure username not in the database!!" });
        }
        else {
            if (bcrypt.compareSync(req.body.password, user.passwordHash)) {
                const token = jwt.encode({ email: user.email }, secret);
                //update user's last access time
                user.lastAccess = new Date();
                user.save((err, user) => {
                    console.log("User's LastAccess has been updated.");
                });
                // Send back a token that contains the user's username
                res.status(201).json({ success: true, token: token, msg: "Login success" });
            }
            else {
                // The line below should be  changed (i.e. status code should be 401 and not 201) once I figure out how to
                // handle 401 errors in the client-side JavaScript code
                res.status(201).json({ success: false, msg: "Email or password invalid." });
            }
        }
    })
    .catch(err => {
        console.log(err);
        res.status(201).send({sucess: false, error: err});
    });
});

module.exports = router;
