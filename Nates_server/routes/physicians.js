var express = require('express');
var router = express.Router();
var Physician = require('../models/physician');
var Patient = require('../models/patient');
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");
const fs = require('fs');

// Read the secret key from a file
const secret = fs.readFileSync(__dirname + '/../keys/jwtkey').toString();

// CRUD implementation for Physicians

/** 
 * CREATE /signup route:
 * This is a route handler for the '/signup' endpoint
 * It's an asynchronous function that facilitates the creation of new physician accounts.
 * The function extracts physician details from the request body, checks if a physician 
 * with the given email already exists, and if not, it creates a new physician
 * account, hashes their password for security, and generates a token for authentication.
*/
router.post('/signup', async function(req, res) {
    try {
        // Extracting physician details from the request body.
        const { newPhysicianFirstName, newPhysicianLastName, newPhysicianEmail, newPhysicianPassword, newPhysicianSpecialty } = req.body;

        // Checking if a physician with the given email already exists in the database.
        const existingPhysicianDoc = await Physician.findOne({ email: newPhysicianEmail });

        if (existingPhysicianDoc) {
            // If a physician exists with the same email, return a conflict response.
            return res.status(409).json({ message: 'A Physician with this email address already exists. Please use a different email address.' });
        }

        // Hashing the password for security using bcrypt.
        const hashedPassword = await bcrypt.hash(newPhysicianPassword, 10);

        // Creating a new physician record with the provided details.
        const newPhysicianDoc = new Physician({
            firstName: newPhysicianFirstName,
            lastName: newPhysicianLastName,
            email: newPhysicianEmail,
            specialty: newPhysicianSpecialty,
            hashedPassword: hashedPassword
        });

        // Saving the new physician record to the database.
        await newPhysicianDoc.save();
        // Encoding a JWT token using the physician's email.
        const token = jwt.encode({ physicianEmail: newPhysicianEmail }, secret);

        // Sending a success response with a custom message and the generated token.
        return res.status(201).json({ message: 'Physician account created successfully.', physicianToken: token });

    } catch (err) {
        // Handling validation errors from Mongoose (e.g., missing required fields or invalid data formats).
        if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ message: 'Your request contains invalid data or missing fields. Please correct and try again.', errors: err.errors });
        }

        // Catching any other unhandled errors and treating them as server errors.
        return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
    }
});

/**
 * READ /read route:
 * This route handler is for the '/read' endpoint
 * It's an asynchronous function designed to read physician information and documents 
 * of their patients from the database. It uses a token provided in the request 
 * headers to authenticate and identify the physician, and then retrieves the physician's 
 * details along with their assigned patient's details.
 */
router.get('/read', async function(req, res) {
    try {
        // Logging the authentication token from request headers for debugging.
        const token = req.headers['x-auth'];

        // Checking if the authentication token is present.
        if (!token) {
            // If the token is missing, send an unauthorized response.
            return res.status(401).json({ message: 'Missing X-Auth header.' });
        }

        // Decoding the token to retrieve the physician's email.
        const decoded = jwt.decode(token, secret);
        const physicianEmail = decoded.physicianEmail;

        // Finding the physician in the database using the email.
        // Using .lean() for improved performance as a Mongoose document is not needed.
        var physicianDoc = await Physician.findOne({ email: physicianEmail }).lean(); 
        if (!physicianDoc) {
            // If the physician is not found, send a not found response.
            return res.status(404).json({ message: 'Physician not found.' });
        }

        // Checking if physicianInfo has an array of patients.
        if (Array.isArray(physicianDoc.patients)) {
            // Fetching patient documents for each patient ID in the array.
            const patientDocs = await Promise.all(
            physicianDoc.patients.map(patientId =>
            Patient.findById(patientId) 
            )
            );
            // Replacing the original patients array with the fetched documents.
            if (patientDocs && patientDocs.length > 0) {
                physicianDoc = physicianDoc.toObject();
                physicianDoc.patients = patientDocs;
            }
        }
        // Sending a successful response with the physician's details.
        return res.status(200).json({ message: 'Physician found.', physicianDoc: physicianDoc });
    } catch (err) {

        // Sending an internal server error response.
        return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
    }
});

/**
 * READ /readAll route:
 * This route handler is for the '/readAll' endpoint
 * It's an asynchronous function designed to read all physician information and documents
 */
router.get('/readAll', async function(req, res) {
    try {
        // Fetching all physician documents from the database.
        // Using .lean() for better performance as it returns plain JavaScript objects instead of Mongoose documents.
        const allPhysicianDocs = await Physician.find({}).lean();

        // Checking if any physicians were found.
        if (!allPhysicianDocs || allPhysicianDocs.length === 0) {
            // If no physicians are found, send a not found response.
            return res.status(404).json({ message: 'No physicians found.' });
        }

        // Sending a successful response with all retrieved physician data.
        return res.status(200).json({ message: 'Physicians retrieved successfully.', allPhysicianDocs: allPhysicianDocs });

    } catch (err) {

        // Handling database connection errors or other internal server errors.
        return res.status(500).json({ message: 'An unexpected error occurred on the server while processing your request.' });
    }
});

/**
 * UPDATE /update route:
 * This route handler is for the '/update' endpoint
 * It's an asynchronous function designed to update patient information in the database.
 * The function uses a token from the request headers for authentication and processes 
 * different types of updates like physician name or password.
 */
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
        const physicianEmail = decoded.physicianEmail;

        // Finding the physician in the database using the email.
        const physicianDoc = await Physician.findOne({ email: physicianEmail });
        if (!physicianDoc) {
            // If the physician is not found, send a not found response.
            return res.status(404).json({ message: "Physician not found." });
        }

        // Handle password update request.
        if(req.body.newPassword){
            const currentPassword = req.body.currentPassword;

            // Verifying the current password with the hashed password in the database.
            if (!bcrypt.compareSync(currentPassword, physicianDoc.hashedPassword)) {
                return res.status(401).json({ message: "Unauthorized: Incorrect current password." });
            }

            // Hashing the new password and updating it in the physician's record.
            const newPassword = req.body.newPassword;
            const newHashedPassword = await bcrypt.hash(newPassword, 10);
            physicianDoc.hashedPassword = newHashedPassword;

            // Removing the password details from the request body.
            delete req.body.newPassword;
            delete req.body.currentPassword;

            // Saving the updated physician information.
            await physicianDoc.save();
            res.status(200).json({ message: "Password updated successfully.", physicianDoc: physicianDoc });
        }
        else {
            // Looping through the request body to update other physician information.
            var message = ''
            for (const key in req.body) {
                if (req.body.hasOwnProperty(key)) { 
                    // Updating the physician's information only if the request body contains the key.
                    if (physicianDoc[key] && req.body[key]){
                        physicianDoc[key] = req.body[key];
                    }
                }
            }

            // Saving the updated physician information.
            await physicianDoc.save();
            res.status(200).json({ message: "Physician info updated successfully.", physicianDoc: physicianDoc });
        }
    } catch (err) {

        // Handling validation errors.
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation error: " + err.message });
        }

        // Handling other uncaught errors.
        res.status(500).json({ message: "An error occurred while updating the patient." });
    }
});

/**
 * DELETE /delete route for physician:
 * This route handles the deletion of a physician's account along with associated references in patients.
 * It performs the following steps:
 * 1. Decodes the JWT token to retrieve the physician's email.
 * 2. Removes the physician document from the MongoDB database.
 * 3. Removes the physician's email from the physicianEmail field of all patients assigned to this physician.
 */
router.delete('/delete', async function(req, res) {
    try {
        const token = req.headers['x-auth'];

        // Check if the authentication token is present in the request headers.
        if (!token) {
            // If the token is missing, send an unauthorized response with a custom message.
            return res.status(401).json({ message: 'Missing X-Auth header.' });
        }

        // Decode the token to retrieve the physician's email.
        const decoded = jwt.decode(token, secret);
        const physicianEmail = decoded.physicianEmail;
        
        // Find and remove the physician
        const physician = await Physician.findOneAndDelete({ email: physicianEmail });
        
        if (!physician) {
            // If physician is not found, return a 404 error
            return res.status(404).json({ message: 'Physician not found.' });
        }
        
        // Remove the physician's email from all assigned patients
        await Patient.updateMany(
            { physicianEmail: physicianEmail },
            { $unset: { physicianEmail: "" } }
        );

        // Return a success response after successful deletion
        res.status(200).json({ message: 'Physician account and associated data deleted successfully.' });
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
 * This asynchronous function handles physician log-in by verifying email and password,
 * and if successful, issues an authentication token.
 */
router.post("/login", async function (req, res) {
    // Check if both email and password are provided in the request body.
    const physicianEmail = req.body.email;
    const physicianPassword = req.body.password;
    if (!physicianEmail || !physicianPassword) {
        // If either email or password is missing, send a bad request response.
        res.status(400).json({ success: false, error: "Missing email and/or password", req: req.body });
        return;
    }

    try {
        // Finding the physician in the database using the email provided in the request body.
        const physicianInDatabase = await Physician.findOne({ email: physicianEmail });

        // Check if the physician exists in the database.
        if (!physicianInDatabase) {
            // If the physician is not found, send an unauthorized response.
            res.status(401).json({ success: false, message: "No physician registered with this email." });
        } else {
            // Compare the provided password with the hashed password in the database.
            if (bcrypt.compareSync(physicianPassword, physicianInDatabase.hashedPassword)) {
                // If password matches, create a JWT token.
                const token = jwt.encode({ physicianEmail: physicianInDatabase.email }, secret);

                // Update the physician's last access time in the database.
                physicianInDatabase.lastAccess = new Date();
                await physicianInDatabase.save();

                // Send back a successful response with the authentication token.
                res.status(200).json({ success: true, physicianToken: token, message: "Login successful" });
            } else {
                // If password does not match, send an unauthorized response.
                res.status(401).json({ success: false, message: "Invalid email or password." });
            }
        }
    } catch (err) {
        // Send an internal server error response.
        res.status(500).json({ success: false, message: 'Error processing your request.' });
    }
});


module.exports = router;
