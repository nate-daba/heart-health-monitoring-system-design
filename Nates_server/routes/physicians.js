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

    await newPhysician.save();
    return res.status(201).json({ message: 'Physician account created successfully.' });

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
  if (!email) {
    return res.status(400).json({ message: 'Missing email parameter.' });
  }

  try {
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


// // UPDATE: route for updating user information
// router.put('/update', async (req, res) => {
//   console.log('req body: ', req.body)
//   console.log('req body email: ', req.body.email)
//   console.log('req body currentPassword: ', req.body.currentPassword)
//   console.log('req body newPassword: ', req.body.newPassword)
//   try {
//     // Validate that email and currentPassword are provided
//     if (!req.body.email) {
//       return res.status(400).json({ message: "Bad request: Email is required" });
//     }

//     const email = req.body.email;
//     delete req.body.email;
//     // Find the user by email
//     const user = await User.findOne({ email: email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }
//     console.log('user: ', user)
//     // Handle password update
//     if(req.body.newPassword){
//       const currentPassword = req.body.currentPassword;
//       console.log('currentPassword(in if): ', currentPassword)
//       if (!bcrypt.compareSync(currentPassword, user.hashedPassword)) {
//         return res.status(401).json({ message: "Unauthorized: Incorrect current password." });
//       }
//       const newPassword = req.body.newPassword;
//       console.log('newPassword: ', newPassword)
//       const newHashedPassword = await bcrypt.hash(newPassword, 10);
//       user.hashedPassword = newHashedPassword;
//       delete req.body.newPassword;
//       delete req.body.currentPassword;
//       // Save the updated user
//       await user.save();
//       res.status(200).json({ message: "Password updated successfully.", user: user });
//     }
//     else{
//       // Loop through the request body to update the user's information
//       var message = ''
//       for (const key in req.body) {
//         if (req.body.hasOwnProperty(key)) { 
//           // Only update the user's information if the request body contains the key
//           if (user[key] && req.body[key]){
//             // Update the user's information
//             user[key] = req.body[key];
//           }
//         }
//       }

//       // Save the updated user
//       await user.save();
//       res.status(200).json({ message: "User updated successfully.", user: user });
//     }
//   } catch (err) {
//     console.error("An error occurred while updating the user:", err);

//     // Handle validation errors
//     if (err.name === 'ValidationError') {
//       return res.status(400).json({ message: "Validation error: " + err.message });
//     }

//     // Handle other errors
//     res.status(500).json({ message: "An error occurred while updating the user." });
//   }
// });

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
