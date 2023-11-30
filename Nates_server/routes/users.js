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

// CRUD implementation

// CREATE
router.post('/signUp', async function(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email address already exists. Please use a different email address.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      hashedPassword
    });

    await newUser.save();
    return res.status(201).json({ message: 'User account created successfully.' });

  } catch (err) {
    console.error('Error during sign up:', err);

    // Handle validation errors from Mongoose
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Your request contains invalid data or missing fields. Please correct and try again.', errors: err.errors });
    }

    // Catch any other unhandled errors as a server error
    return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
  }
});


// READ
router.get('/read/:email', async function(req, res) {

  var email = req.params.email;
  if(!email){
    return res.status(400).json({ message: 'Missing email parameter.' });
  }
  try {
    var userInfo = await User.findOne({ email: email });
    if(!userInfo){
      return res.status(404).json({ message: 'User not found.' });
    }
    console.log('User found: ', userInfo);
    return res.status(200).json({ message: 'User found.', userInfo: userInfo });
  } catch (err) {
    console.error('Error during user lookup:', err);
    return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
  }
  
});
router.post("/logIn", async function (req, res) 
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
  try {
    const userInDatabase = await User.findOne({ email: req.body.email });
    if (!userInDatabase) {
      res.status(401).json({ success: false, message: "Login failure username not in the database!!" });
    }
    else {
      if (bcrypt.compareSync(req.body.password, userInDatabase.hashedPassword)) {
        const token = jwt.encode({ email: userInDatabase.email }, secret);
        //update user's last access time
        userInDatabase.lastAccess = new Date();
        userInDatabase.save().then(response => {
          console.log("User's LastAccess has been updated.");
        });
        // Send back a token that contains the user's username
        res.status(201).json({ success: true, token: token, message: "Login success" });
      }
      else {
        // The line below should be  changed (i.e. status code should be 401 and not 201) once I figure out how to
        // handle 401 errors in the client-side JavaScript code
        res.status(401).json({ success: false, message: "Email or password invalid." });
      }
    }
  } catch(err){
    console.error(err);
    res.status(500).json({ message: 'Error processing your request.' });
  }
});

module.exports = router;
