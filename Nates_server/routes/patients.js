var express = require('express');
var router = express.Router();
var patient = require('../models/patient');
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");
const fs = require('fs');
const Physician = require('../models/physician');

// Read the secret key from a file
const secret = fs.readFileSync(__dirname + '/../keys/jwtkey').toString();

// CRUD implementation for patients
// This is a route handler for the '/signUp' endpoint using Express.js. 
// It's an asynchronous function that facilitates the creation of new patient accounts.
// The function extracts user details from the request body, checks if a user with the given email already exists,
// and if not, it creates a new user account, hashes their password for security, and generates a token for authentication.
router.post('/signUp', async function(req, res) {
  try {
    // Destructuring to extract user details from the request body.
    const { firstName, lastName, email, password } = req.body;

    // Check if a patient with the same email already exists in the database.
    const existingpatient = await patient.findOne({ email: email });
    if (existingpatient) {
      // If patient exists, send a conflict response with a custom message.
      return res.status(409).json({ message: 'A patient with this email address already exists. Please use a different email address.' });
    }

    // Encode a new JWT token using the patient's email.
    const token = jwt.encode({ email: email }, secret);

    // Hash the password using bcrypt with a salt round of 10 for security.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new patient record with the provided details.
    const newpatient = new patient({
      firstName,
      lastName,
      email,
      hashedPassword
    });

    // Save the new patient record to the database.
    await newpatient.save();

    // Send a success response with a custom message and the generated token.
    return res.status(201).json({ message: 'patient account created successfully.', token: token });

  } catch (err) {
    // Log any errors that occur during the process.
    console.error('Error during sign up:', err);

    // Handle validation errors from Mongoose, such as missing required fields or invalid data formats.
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Your request contains invalid data or missing fields. Please correct and try again.', errors: err.errors });
    }

    // Catch any other unhandled errors and treat them as server errors.
    return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
  }
});

// This route handler is for the '/read' endpoint using Express.js.
// It's an asynchronous function designed to read patient information and their associated physician from the database.
// It uses a token provided in the request headers to authenticate and identify the patient, 
// and then retrieves the patient's details along with their associated physician's details.
router.get('/read', async function(req, res) {
  try {
    // Log the authentication token received in the request headers.
    const token = req.headers['x-auth'];

    // Check if the authentication token is present in the request headers.
    if (!token) {
        // If the token is missing, send an unauthorized response with a custom message.
        return res.status(401).json({ message: 'Missing X-Auth header.' });
    }

    // Decode the token to retrieve the patient's email.
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;

    // Find the patient in the database using their email.
    var patientInfo = await patient.findOne({ email: email });

    // Check if the patient was found.
    if (!patientInfo) {
        // If not found, send a not found response with a custom message.
        return res.status(404).json({ message: 'patient not found.' });
    }

    // Check if the patient has an associated physician's email.
    if (patientInfo.physicianEmail) {
        // Find the physician in the database using the email.
        var physicianInfo = await Physician.findOne({ email: patientInfo.physicianEmail });

        // Check if the physician was found.
        if (physicianInfo) {
            // Convert Mongoose document to a plain object to modify it.
            patientInfo = patientInfo.toObject();

            // Add the physician's details to the patient's information.
            patientInfo.physicianDoc = physicianInfo;
        }
    }

    // Log the found patient information.
    console.log('patient found: ', patientInfo);

    // Send a success response with the patient's information.
    return res.status(200).json({ message: 'patient found.', patientInfo: patientInfo });
  } catch (err) {
      // Log any errors that occur during the process.
      console.error('Error during patient lookup:', err);

      // Send an internal server error response with a custom message.
      return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
  }
});

// This route handler is for the '/update' endpoint using Express.js.
// It's an asynchronous function designed to update patient information in the database.
// The function uses a token from the request headers for authentication and processes different types of updates like physician or password.
router.put('/update', async (req, res) => {
  try {
    // Extracting the token from the request headers and decoding it to get the patient's email.
    const token = req.headers['x-auth'];
    const decoded = jwt.decode(token, secret);
    const email = decoded.email;

    // Finding the patient in the database using the email.
    const patient = await patient.findOne({ email: email });
    if (!patient) {
      // If the patient is not found, send a not found response with a custom message.
      return res.status(404).json({ message: "patient not found." });
    }
    console.log('patient: ', patient)

    // Check if the update is for the physician's email.
    if(req.body.physicianEmail){
      // If the patient already has a physician, update the old physician's record.
      if(patient.physicianEmail) {
        const oldPhysician = await Physician.findOne({ email: patient.physicianEmail });
        if(oldPhysician) {
            // Removing the patient's ID from the old physician's patients list.
            oldPhysician.patients = oldPhysician.patients.filter(patientId => !patientId.equals(patient._id));
            await oldPhysician.save();
        }
      }
      // Update the physician email in the patient's record.
      const physicianEmail = req.body.physicianEmail;
      patient.physicianEmail = physicianEmail;
      await patient.save();
      console.log('patient physician updated successfully')

      // Find and update the new physician's record with the patient's ID.
      const selectedPhysician = await Physician.findOne({ email: physicianEmail });
      if (!selectedPhysician) {
        // If the new physician is not found, send a not found response.
        return res.status(404).json({ message: "Physician not found." });
      }
      console.log('selectedPhysician: ', selectedPhysician)
      selectedPhysician.patients.push(patient._id);
      await selectedPhysician.save();
      res.status(200).json({ message: "Physician updated successfully.", patient: patient });
      return;
    }

    // Check if the update is for the patient's password.
    else if(req.body.newPassword){
      const currentPassword = req.body.currentPassword;
      console.log('currentPassword(in if): ', currentPassword)
      // Verify the current password with the hashed password in the database.
      if (!bcrypt.compareSync(currentPassword, patient.hashedPassword)) {
        return res.status(401).json({ message: "Incorrect current password." });
      }
      // Hash the new password and update the patient's record.
      const newPassword = req.body.newPassword;
      console.log('newPassword: ', newPassword)
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      patient.hashedPassword = newHashedPassword;
      delete req.body.newPassword;
      delete req.body.currentPassword;
      await patient.save();
      res.status(200).json({ message: "Password updated successfully.", patient: patient });
    }

    // Handle other updates to the patient's information.
    else{
      var message = ''
      for (const key in req.body) {
        if (req.body.hasOwnProperty(key)) {
          if (patient[key] && req.body[key]){
            patient[key] = req.body[key];
          }
        }
      }
      await patient.save();
      res.status(200).json({ message: "patient updated successfully.", patient: patient });
    }
  } catch (err) {
    console.error("An error occurred while updating the patient:", err);

    // Handle validation errors.
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error: " + err.message });
    }

    // Handle other uncaught errors.
    res.status(500).json({ message: "An error occurred while updating the patient." });
  }
});

// Route handler for '/logIn' endpoint using Express.js.
// This asynchronous function handles patient log-in by verifying email and password,
// and if successful, issues an authentication token.
router.post("/logIn", async function (req, res) {
  // Logging the request body and credentials for debugging.
  console.log('req body: ', req.body);
  console.log('req body email: ', req.body.email);
  console.log('req body password: ', req.body.password);

  // Check if both email and password are provided in the request body.
  if (!req.body.email || !req.body.password) {
    // If either email or password is missing, send an unsuccessful response.
    res.status(201).json({ success: false, error: "Missing email and/or password", req: req.body});
    return;
  }

  // Attempt to retrieve the patient from the database using the provided email.
  try {
    const patientInDatabase = await patient.findOne({ email: req.body.email });

    // Check if the patient exists in the database.
    if (!patientInDatabase) {
      // If the patient is not found, send an unauthorized response.
      res.status(401).json({ success: false, message: "Login failure: patient not in the database!!" });
    }
    else {
      // If the patient is found, compare the provided password with the hashed password in the database.
      if (bcrypt.compareSync(req.body.password, patientInDatabase.hashedPassword)) {
        // If password matches, create a new JWT token.
        const token = jwt.encode({ email: patientInDatabase.email }, secret);

        // Update the patient's last access time in the database.
        patientInDatabase.lastAccess = new Date();
        patientInDatabase.save().then(response => {
          console.log("patient's LastAccess has been updated.");
        });

        // Send back a successful response with the authentication token.
        res.status(201).json({ success: true, patientToken: token, message: "Login success" });
      }
      else {
        // If password does not match, send an unauthorized response.
        res.status(401).json({ success: false, message: "Email or password invalid." });
      }
    }
  } catch(err){
    // Log any errors that occur during the process.
    console.error(err);
    // Send an internal server error response.
    res.status(500).json({ message: 'Error processing your request.' });
  }
});

module.exports = router;
