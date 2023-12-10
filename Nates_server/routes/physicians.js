var express = require('express');
var router = express.Router();
var Physician = require('../models/physician');
var Patient = require('../models/patient');
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");
const fs = require('fs');

// Read the secret key from a file
const secret = fs.readFileSync(__dirname + '/../keys/jwtkey').toString();

// CRUD implementation

// Route handler for '/signup' endpoint 
// This asynchronous function handles the creation of new physician accounts.
// It checks for existing accounts with the same email, hashes the password for security, and creates a new account with a token.
router.post('/signup', async function(req, res) {
  try {
    // Extracting physician details from the request body.
    const { firstName, lastName, email, password, specialty } = req.body;

    // Checking if a physician with the given email already exists in the database.
    const existingPhysician = await Physician.findOne({ email: email });
    if (existingPhysician) {
      // If a physician exists with the same email, return a conflict response.
      return res.status(409).json({ message: 'A Physician with this email address already exists. Please use a different email address.' });
    }

    // Hashing the password for security using bcrypt.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creating a new physician record with the provided details.
    const newPhysician = new Physician({
      firstName,
      lastName,
      email,
      specialty,
      hashedPassword
    });

    // Encoding a JWT token using the physician's email.
    const token = jwt.encode({ email: email }, secret);

    // Saving the new physician record to the database.
    await newPhysician.save();

    // Sending a success response with a custom message and the generated token.
    return res.status(201).json({ message: 'Physician account created successfully.', token: token });

  } catch (err) {
    // Logging any errors that occur during the signup process.
    console.error('Error during sign up:', err);

    // Handling validation errors from Mongoose (e.g., missing required fields or invalid data formats).
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Your request contains invalid data or missing fields. Please correct and try again.', errors: err.errors });
    }

    // Catching any other unhandled errors and treating them as server errors.
    return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
  }
});


// Route handler for the '/read' endpoint
// This asynchronous function handles retrieving physician information from the database,
// including their associated patients, using a token provided in the request headers.
router.get('/read', async function(req, res) {

  try {
    // Logging the authentication token from request headers for debugging.
    console.log('req headers: ', req.headers['x-auth']);
    const token = req.headers['x-auth'];

    // Checking if the authentication token is present.
    if (!token) {
        // If the token is missing, send an unauthorized response.
        return res.status(401).json({ message: 'Missing X-Auth header.' });
    }

    // Decoding the token to retrieve the physician's email.
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;

    // Finding the physician in the database using the email.
    var physicianInfo = await Physician.findOne({ email: email }).lean(); // Using .lean() for improved performance as a Mongoose document is not needed.
    if (!physicianInfo) {
      // If the physician is not found, send a not found response.
      return res.status(404).json({ message: 'Physician not found.' });
    }
    console.log('physicianInfo: ', physicianInfo);

    // Checking if physicianInfo has an array of patients.
    if (Array.isArray(physicianInfo.patients)) {
      // Fetching patient documents for each patient ID in the array.
      const patientsDocuments = await Promise.all(
        physicianInfo.patients.map(patientId =>
          Patient.findById(patientId) // Assuming 'Patient' is your patient model.
        )
      );
      console.log('Updated patientsDocuments: ', patientsDocuments)

      // Replacing the original patients array with the fetched documents.
      physicianInfo.patients = patientsDocuments;
    }

    // Logging the found physician information and sending a successful response.
    console.log('Physician found: ', physicianInfo);
    return res.status(200).json({ message: 'Physician found.', physicianInfo: physicianInfo });
  } catch (err) {
    // Logging any errors that occur during the process.
    console.error('Error during patient lookup:', err);

    // Sending an internal server error response.
    return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
  }
});

// Route handler for the '/readAll' endpoint
// This asynchronous function is designed to retrieve all physician records from the database.
router.get('/readAll', async function(req, res) {
  try {
      // Fetching all physician documents from the database.
      // Using .lean() for better performance as it returns plain JavaScript objects instead of Mongoose documents.
      const allPhysicians = await Physician.find({}).lean();

      // Checking if any physicians were found.
      if (!allPhysicians || allPhysicians.length === 0) {
          // If no physicians are found, send a not found response.
          return res.status(404).json({ message: 'No physicians found.' });
      }

      // Sending a successful response with all retrieved physician data.
      return res.status(200).json({ message: 'Physicians retrieved successfully.', physicians: allPhysicians });

  } catch (err) {
      // Logging any errors that occur during the fetching process.
      console.error('Error during fetching all physicians:', err);

      // Handling database connection errors or other internal server errors.
      return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
  }
});

// Route handler for the '/update' endpoint
// This asynchronous function handles updating physician information, including password changes.
router.put('/update', async (req, res) => {
  try {
    // Extracting the authentication token from the request headers.
    const token = req.headers['x-auth'];
    if (!token) {
        // If the token is missing, send an unauthorized response.
        return res.status(401).json({ message: 'Missing X-Auth header.' });
    }

    // Decoding the token to get the physician's email.
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;

    // Finding the physician in the database using the email.
    const physician = await Physician.findOne({ email: email });
    if (!physician) {
      // If the physician is not found, send a not found response.
      return res.status(404).json({ message: "Physician not found." });
    }
    console.log('patient: ', physician)

    // Handle password update request.
    if(req.body.newPassword){
      const currentPassword = req.body.currentPassword;
      console.log('currentPassword(in if): ', currentPassword)

      // Verifying the current password with the hashed password in the database.
      if (!bcrypt.compareSync(currentPassword, physician.hashedPassword)) {
        return res.status(401).json({ message: "Unauthorized: Incorrect current password." });
      }

      // Hashing the new password and updating it in the physician's record.
      const newPassword = req.body.newPassword;
      console.log('newPassword: ', newPassword)
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      physician.hashedPassword = newHashedPassword;

      // Removing the password details from the request body.
      delete req.body.newPassword;
      delete req.body.currentPassword;

      // Saving the updated physician information.
      await physician.save();
      res.status(200).json({ message: "Password updated successfully.", physician: physician });
    }
    else{
      // Looping through the request body to update other physician information.
      var message = ''
      for (const key in req.body) {
        if (req.body.hasOwnProperty(key)) { 
          // Updating the physician's information only if the request body contains the key.
          if (physician[key] && req.body[key]){
            physician[key] = req.body[key];
          }
        }
      }

      // Saving the updated physician information.
      console.log('got here')
      await physician.save();
      res.status(200).json({ message: "Physician info updated successfully.", physician: physician });
    }
  } catch (err) {
    // Logging any errors that occur during the update process.
    console.error("An error occurred while updating the patient:", err);

    // Handling validation errors.
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error: " + err.message });
    }

    // Handling other uncaught errors.
    res.status(500).json({ message: "An error occurred while updating the patient." });
  }
});


// Route handler for the '/login' endpoint
// This asynchronous function handles the login process for physicians,
// verifying their credentials and issuing an authentication token upon successful login.
router.post("/login", async function (req, res) {
  // Check if both email and password are provided in the request body.
  if (!req.body.email || !req.body.password) {
    // If either email or password is missing, send a bad request response.
    res.status(400).json({ success: false, error: "Missing email and/or password" });
    return;
  }

  try {
    // Finding the physician in the database using the email provided in the request body.
    const physicianInDatabase = await Physician.findOne({ email: req.body.email });

    // Check if the physician exists in the database.
    if (!physicianInDatabase) {
      // If the physician is not found, send an unauthorized response.
      res.status(401).json({ success: false, message: "No physician registered with this email." });
    } else {
      // Compare the provided password with the hashed password in the database.
      if (bcrypt.compareSync(req.body.password, physicianInDatabase.hashedPassword)) {
        // If password matches, create a JWT token.
        const token = jwt.encode({ email: physicianInDatabase.email }, secret);

        // Update the physician's last access time in the database.
        physicianInDatabase.lastAccess = new Date();
        await physicianInDatabase.save();

        // Send back a successful response with the authentication token.
        res.status(200).json({ success: true, token: token, message: "Login successful" });
      } else {
        // If password does not match, send an unauthorized response.
        res.status(401).json({ success: false, message: "Invalid email or password." });
      }
    }
  } catch (err) {
    // Log any errors that occur during the login process.
    console.error(err);
    // Send an internal server error response.
    res.status(500).json({ success: false, message: 'Error processing your request.' });
  }
});


module.exports = router;
