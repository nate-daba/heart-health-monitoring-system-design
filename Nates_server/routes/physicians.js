var express = require('express');
var router = express.Router();
var Physician = require('../models/physician');
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
router.post('/signup', async function(req, res) {
  try {
    const { firstName, lastName, email, password, specialty } = req.body;

    const existingPhysician = await Physician.findOne({ email: email });
    if (existingPhysician) {
      return res.status(409).json({ message: 'A Physician with this email address already exists. Please use a different email address.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newPhysician = new Physician({
      firstName,
      lastName,
      email,
      specialty,
      hashedPassword
    });
    const token = jwt.encode({ email: email }, secret);
    await newPhysician.save();
    return res.status(201).json({ message: 'Physician account created successfully.', token: token });

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
router.get('/read', async function(req, res) {

  try {
    console.log('req headers: ', req.headers['x-auth']);
    const token = req.headers['x-auth'];
    if (!token) {
        return res.status(401).json({ message: 'Missing X-Auth header.' });
    }
    // Decode the token to get the physicians email
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;

    var physicianInfo = await Physician.findOne({ email: email }).lean(); // Use .lean() for performance if you don't need a mongoose document
    if (!physicianInfo) {
      return res.status(404).json({ message: 'Physician not found.' });
    }
    console.log('physicianInfo: ', physicianInfo);
    // Check if physicianInfo has patients and it's an array
    if (Array.isArray(physicianInfo.patients)) {
      // Fetch user documents based on IDs in the patients array
      const patientsDocuments = await Promise.all(
        physicianInfo.patients.map(patientId =>
          User.findById(patientId) // Assuming User is your user model
        )
      );
      console.log('Updated patientsDocuments: ', patientsDocuments)
      // Replace the original patients array with the fetched documents
      physicianInfo.patients = patientsDocuments;
    }

    console.log('User found: ', physicianInfo);
    return res.status(200).json({ message: 'Physician found.', physicianInfo: physicianInfo });
  } catch (err) {
    console.error('Error during user lookup:', err);
    return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
  }
});

// READ ALL Physicians
router.get('/readAll', async function(req, res) {
  try {
      
      // Fetch all physician documents from the database
      const allPhysicians = await Physician.find({}).lean(); // Using .lean() for better performance

      if (!allPhysicians || allPhysicians.length === 0) {
          return res.status(404).json({ message: 'No physicians found.' });
      }

      return res.status(200).json({ message: 'Physicians retrieved successfully.', physicians: allPhysicians });

  } catch (err) {
      console.error('Error during fetching all physicians:', err);
      
      // Handle database connection errors or other internal server errors
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

    const token = req.headers['x-auth'];
    if (!token) {
        return res.status(401).json({ message: 'Missing X-Auth header.' });
    }
    // Decode the token to get the physicians email
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;

    // Find the user by email
    const physician = await Physician.findOne({ email: email });
    if (!physician) {
      return res.status(404).json({ message: "Physician not found." });
    }
    console.log('user: ', physician)
    // Handle password update
    if(req.body.newPassword){
      const currentPassword = req.body.currentPassword;
      console.log('currentPassword(in if): ', currentPassword)
      if (!bcrypt.compareSync(currentPassword, physician.hashedPassword)) {
        return res.status(401).json({ message: "Unauthorized: Incorrect current password." });
      }
      const newPassword = req.body.newPassword;
      console.log('newPassword: ', newPassword)
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      physician.hashedPassword = newHashedPassword;
      delete req.body.newPassword;
      delete req.body.currentPassword;
      // Save the updated user
      await physician.save();
      res.status(200).json({ message: "Password updated successfully.", physician: physician });
    }
    else{
      // Loop through the request body to update the user's information
      var message = ''
      for (const key in req.body) {
        if (req.body.hasOwnProperty(key)) { 
          // Only update the user's information if the request body contains the key
          if (physician[key] && req.body[key]){
            // Update the user's information
            physician[key] = req.body[key];
          }
        }
      }

      // Save the updated user
      console.log('got here')
      await physician.save();
      res.status(200).json({ message: "User updated successfully.", user: physician });
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

router.post("/login", async function (req, res) {
  if (!req.body.email || !req.body.password) {
    res.status(400).json({ success: false, error: "Missing email and/or password" });
    return;
  }
  try {
    const physicianInDatabase = await Physician.findOne({ email: req.body.email });
    if (!physicianInDatabase) {
      res.status(401).json({ success: false, message: "No physician registered with this email." });
    } else {
      if (bcrypt.compareSync(req.body.password, physicianInDatabase.hashedPassword)) {
        const token = jwt.encode({ email: physicianInDatabase.email }, secret);
        physicianInDatabase.lastAccess = new Date();
        await physicianInDatabase.save();
        res.status(200).json({ success: true, token: token, message: "Login successful" });
      } else {
        res.status(401).json({ success: false, message: "Invalid email or password." });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error processing your request.' });
  }
});

module.exports = router;
