var express = require('express');
var router = express.Router();
var Patient = require('../models/patient');
const Physician = require('../models/physician');
const Device = require('../models/device');
const SensorData = require('../models/sensorData');
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");
const fs = require('fs');


// Read the secret key from a file
const secret = fs.readFileSync(__dirname + '/../keys/jwtkey').toString();

// CRUD implementation for patients

/** 
 * CREATE /signup route:
 * This is a route handler for the '/signUp' endpoint
 * It's an asynchronous function that facilitates the creation of new patient accounts.
 * The function extracts patient details from the request body, checks if a patient 
 * with the given email already exists, and if not, it creates a new patient 
 * account, hashes their password for security, and generates a token for authentication.
*/
router.post('/signup', async function(req, res) {
    try {
        // Destructuring to extract patient details from the request body.
        const { newPatientFirstName, newPatientLastName, newPatientEmail, newPatientPassword } = req.body;

        // Check if a patient with the same email already exists in the database.
        const existingPatientDoc = await Patient.findOne({ email: newPatientEmail });

        if (existingPatientDoc) {
            // If patient exists, send a conflict response with a custom message.
            return res.status(409).json({ message: 'A patient with this email address already exists. Please use a different email address.' });
        }

        // Hash the password using bcrypt with a salt round of 10 for security.
        const hashedPassword = await bcrypt.hash(newPatientPassword, 10);

        // Create a new patient record with the provided details.
        const newPatientDoc = new Patient({
            firstName: newPatientFirstName,
            lastName: newPatientLastName,
            email: newPatientEmail,
            hashedPassword: hashedPassword
        });

        // Save the new patient record to the database.
        await newPatientDoc.save();

        // Encode a new JWT token using the patient's email.
        const token = jwt.encode({ patientEmail: newPatientEmail }, secret);

        // Send a success response with a custom message and the generated token.
        return res.status(201).json({ message: 'patient account created successfully.', patientToken: token });

    } catch (err) {
        // Handle validation errors from Mongoose, such as missing required fields or invalid data formats.
        if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ message: 'Your request contains invalid data or missing fields. Please correct and try again.', errors: err.errors });
        }

        // Catch any other unhandled errors and treat them as server errors.
        return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
    }
});

/**
 * READ /read route:
 * This route handler is for the '/read' endpoint
 * It's an asynchronous function designed to read patient information and their
 * associated physician from the database. It uses a token provided in the request 
 * headers to authenticate and identify the patient, and then retrieves the patient's 
 * details along with their associated physician's details.
 */
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
        const patientEmail = decoded.patientEmail;

        // Find the patient in the database using their email.
        var patientDoc = await Patient.findOne({ email: patientEmail });

        // Check if the patient was found.
        if (!patientDoc) {
            // If not found, send a not found response with a custom message.
            return res.status(404).json({ message: 'Patient not found.' });
        }

        // Check if the patient has an associated physician's email.
        if (patientDoc.physicianEmail) {
        // Find the physician in the database using the email.
        var physicianDoc = await Physician.findOne({ email: patientDoc.physicianEmail });

        // Check if the physician was found.
        if (physicianDoc) {
        // Convert Mongoose document to a plain object to modify it.
        patientDoc = patientDoc.toObject();

        // Add the physician's details to the patient's information.
        patientDoc.physicianDoc = physicianDoc;
        }
    }

    // Send a success response with the patient's information.
    return res.status(200).json({ message: 'Patient found.', patientDoc: patientDoc });

    } catch (err) {
        // Send an internal server error response with a custom message.
        return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
    }
});

/**
 * UPDATE /update route:
 * This route handler is for the '/update' endpoint
 * It's an asynchronous function designed to update patient information in the database.
 * The function uses a token from the request headers for authentication and processes 
 * different types of updates like physician or password.
 */
router.put('/update', async (req, res) => {
    try {
        const token = req.headers['x-auth'];

        // Check if the authentication token is present in the request headers.
        if (!token) {
            // If the token is missing, send an unauthorized response with a custom message.
            return res.status(401).json({ message: 'Missing X-Auth header.' });
        }

        // Decode the token to retrieve the patient's email.
        const decoded = jwt.decode(token, secret);
        const patientEmail = decoded.patientEmail;

        // Find the patient in the database using their email.
        var patientDoc = await Patient.findOne({ email: patientEmail });

        // Check if the patient was found.
        if (!patientDoc) {
            // If not found, send a not found response with a custom message.
            return res.status(404).json({ message: 'Patient not found.' });
        }    

        // Check if the update is for the physician's email.
        const newAssignedPhysicianEmail = req.body.physicianEmail;
        if(newAssignedPhysicianEmail){
            // If the patient already has a physician, update the old physician's record
            // by removing the patient's ID from the physician's patientIds list.
            if(patientDoc.physicianEmail) {
                const oldPhysicianDoc = await Physician.findOne({ email: patientDoc.physicianEmail });
                if(oldPhysicianDoc) {
                    // Removing the patient's ID from the old physician's patients list.
                    oldPhysicianDoc.patients = oldPhysicianDoc.patients.filter(patientId => !patientId.equals(patientDoc._id));
                    await oldPhysicianDoc.save();
                }
            }

            // Update the physician email in the patient's record.
            patientDoc.physicianEmail = newAssignedPhysicianEmail;
            await patientDoc.save();

            // Find and update the new physician's record with the patient's ID.
            const selectedPhysicianDoc = await Physician.findOne({ email: newAssignedPhysicianEmail });
            if (!selectedPhysicianDoc) {
                // If the new physician is not found, send a not found response.
                return res.status(404).json({ message: "Physician not found." });
            }

            selectedPhysicianDoc.patients.push(patientDoc._id);
            await selectedPhysicianDoc.save();
            res.status(200).json({ message: "Physician updated successfully.", patientDoc: patientDoc });
            return;
        }

        // Check if the update is for the patient's password.
        else if(req.body.newPassword){

            const currentPassword = req.body.currentPassword;
            
            // Verify the current password with the hashed password in the database.
            if (!bcrypt.compareSync(currentPassword, patientDoc.hashedPassword)) {
                return res.status(401).json({ message: "Incorrect current password." });
            }

            // Hash the new password and update the patient's record.
            const newPassword = req.body.newPassword;
            const newHashedPassword = await bcrypt.hash(newPassword, 10);
            patientDoc.hashedPassword = newHashedPassword;
            delete req.body.newPassword;
            delete req.body.currentPassword;
            await patientDoc.save();
            res.status(200).json({ message: "Password updated successfully.", patientDoc: patientDoc });
        }

        // Handle other updates (i.e. first name and last name) to the patient's information.
        else {
            var message = ''
            for (const key in req.body) {
                if (req.body.hasOwnProperty(key)) {
                    if (patientDoc[key] && req.body[key]){
                        patientDoc[key] = req.body[key];
                    }
                }
            }
            await patientDoc.save();
            res.status(200).json({ message: "Patient updated successfully.", patientDoc: patientDoc });
        }
    } catch (err) {
        // Handle validation errors.
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation error: " + err.message });
        }
        // Handle other uncaught errors.
        res.status(500).json({ message: "An error occurred while updating the patient." });
    }
});

/**
 * DELETE /delete route:
 * This route handles the deletion of a patient's account along with all associated data.
 * It performs the following steps:
 * 1. Decodes the JWT token to retrieve the patient's email.
 * 2. Removes the patient document from the MongoDB database.
 * 3. Finds and deletes all devices associated with the patient's email.
 * 4. Deletes all sensor data associated with the devices of the patient.
 * 5. Removes the patient's ID from the physician's list of patients.
 */
router.delete('/delete', async function(req, res) {
    try {
        const token = req.headers['x-auth'];

        // Check if the authentication token is present in the request headers.
        if (!token) {
            // If the token is missing, send an unauthorized response with a custom message.
            return res.status(401).json({ message: 'Missing X-Auth header.' });
        }

        // Decode the token to retrieve the patient's email.
        const decoded = jwt.decode(token, secret);
        const patientEmail = decoded.patientEmail;
        
        // Find and remove the patient
        const patient = await Patient.findOneAndDelete({ email: patientEmail });
        
        if (!patient) {
            // If patient is not found, return a 404 error
            return res.status(404).json({ message: 'Patient not found.' });
        }
        
        // Find all devices associated with the patient's email
        const devices = await Device.find({ patientEmail: patientEmail });

        // Remove all sensor data associated with the devices
        for (let device of devices) {
            await SensorData.deleteMany({ deviceId: device.deviceId });
        }

        // Remove all devices associated with the patient's email
        await Device.deleteMany({ patientEmail: patientEmail });

        // Remove the patient's ID from the physician's patientIds list
        if (patient.physicianEmail) {
            await Physician.updateOne(
                { email: patient.physicianEmail },
                { $pull: { patients: patient._id } }
            );
        }

        // Return a success response after successful deletion
        res.status(200).json({ message: 'Patient account and associated data deleted successfully.' });
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            // Handle JWT errors such as invalid token
            return res.status(401).json({ message: 'Invalid token.' });
        }

        // Handle any other errors that may occur during the process
        return res.status(500).json({ message: 'An error occurred while processing your request.', error: err.message });
    }
});

/** 
 * Route handler for '/logIn' endpoint 
 * This asynchronous function handles patient log-in by verifying email and password,
 * and if successful, issues an authentication token.
 */
router.post("/login", async function (req, res) {

    // Check if both email and password are provided in the request body.
    const patientEmail = req.body.email;
    const patientPassword = req.body.password;
    if (!patientEmail || !patientPassword) {
        // If either email or password is missing, send an unsuccessful response.
        res.status(201).json({ success: false, error: "Missing email and/or password", req: req.body});
        return;
    }

    // Attempt to retrieve the patient from the database using the provided email.
    try {
        const patientInDatabase = await Patient.findOne({ email: patientEmail});

        // Check if the patient exists in the database.
        if (!patientInDatabase) {
            // If the patient is not found, send an unauthorized response.
            res.status(401).json({ success: false, message: "Login failure: patient not in the database!!" });
        }
        else {
            // If the patient is found, compare the provided password with the hashed password in the database.
            if (bcrypt.compareSync(patientPassword, patientInDatabase.hashedPassword)) {
                // If password matches, create a new JWT token.
                const token = jwt.encode({ patientEmail: patientInDatabase.email }, secret);

                // Update the patient's last access time in the database.
                patientInDatabase.lastAccess = new Date();
                await patientInDatabase.save();

                // Send back a successful response with the authentication token.
                res.status(201).json({ success: true, patientToken: token, message: "Login success" });
            }
            else {
                // If password does not match, send an unauthorized response.
                res.status(401).json({ success: false, message: "Email or password invalid." });
            }
        }
    } catch(err){
        // Send an internal server error response.
        res.status(500).json({ message: 'Error processing your request.' });
    }
});

module.exports = router;
