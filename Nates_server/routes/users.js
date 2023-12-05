var express = require('express');
var router = express.Router();
var User = require('../models/user');
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");
const fs = require('fs');
const Physician = require('../models/physician');

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
  console.log('req params: ', req.params);
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

// UPDATE: route for updating user information
router.put('/update', async (req, res) => {
  console.log('req body: ', req.body)
  console.log('req body email: ', req.body.email)
  console.log('req body currentPassword: ', req.body.currentPassword)
  console.log('req body newPassword: ', req.body.newPassword)
  try {
    // Validate that email and currentPassword are provided
    if (!req.body.email) {
      return res.status(400).json({ message: "Bad request: Email is required" });
    }

    const email = req.body.email;
    delete req.body.email;
    // Find the user by email
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    console.log('user: ', user)
    // Handle physician update
    if(req.body.physicianEmail){
      const physicianEmail = req.body.physicianEmail;
      user.physicianEmail = physicianEmail;
      // Update physician of the patient
      await user.save();
      console.log('User physician updated successfully')

      const selectedPhysician = await Physician.findOne({ email: physicianEmail });
      
      if (!selectedPhysician) {
        return res.status(404).json({ message: "Physician not found." });
      }
      console.log('selectedPhysician: ', selectedPhysician)
      // Update the list of patients of the physician
      selectedPhysician.patients.push(user._id);
      await selectedPhysician.save();
      res.status(200).json({ message: "Physician updated successfully.", user: user });
      return;
    }
    // Handle password update
    else if(req.body.newPassword){
      const currentPassword = req.body.currentPassword;
      console.log('currentPassword(in if): ', currentPassword)
      if (!bcrypt.compareSync(currentPassword, user.hashedPassword)) {
        return res.status(401).json({ message: "Unauthorized: Incorrect current password." });
      }
      const newPassword = req.body.newPassword;
      console.log('newPassword: ', newPassword)
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      user.hashedPassword = newHashedPassword;
      delete req.body.newPassword;
      delete req.body.currentPassword;
      // Save the updated user
      await user.save();
      res.status(200).json({ message: "Password updated successfully.", user: user });
    }
    else{
      // Loop through the request body to update the user's information
      var message = ''
      for (const key in req.body) {
        if (req.body.hasOwnProperty(key)) { 
          // Only update the user's information if the request body contains the key
          if (user[key] && req.body[key]){
            // Update the user's information
            user[key] = req.body[key];
          }
        }
      }

      // Save the updated user
      await user.save();
      res.status(200).json({ message: "User updated successfully.", user: user });
    }
  } catch (err) {
    console.error("An error occurred while updating the user:", err);

    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error: " + err.message });
    }

    // Handle other errors
    res.status(500).json({ message: "An error occurred while updating the user." });
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
