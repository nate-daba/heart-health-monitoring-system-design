var express = require('express');
var router = express.Router();
var Physician = require('../models/physician');
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");
const fs = require('fs');

// Read the secret key from a file
const secret = fs.readFileSync(__dirname + '/../keys/jwtkey').toString();
/* GET physician listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signUp-physician', async function(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingPhysician = await Physician.findOne({ email: email });
    if (existingPhysician) {
      return res.status(409).json({ message: 'A physician with this email address already exists. Please use a different email address.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newPhysician = new Physician({
      firstName,
      lastName,
      email,
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



router.post("/logIn-physician", async function (req, res) 
{
  console.log('req body: ', req.body);
  console.log('req body email: ', req.body.email);
  console.log('req body password: ', req.body.password);
  if (!req.body.email || !req.body.password) 
  {
    res.status(201).json({ sucess: false, error: "Missing email and/or password", req: req.body});
    return;
  }
  // Get physician from the database
  try {
    const physicianInDatabase = await Physician.findOne({ email: req.body.email });
    if (!physicianInDatabase) {
      res.status(401).json({ success: false, message: "Login failure username not in the database!!" });
    }
    else {
      if (bcrypt.compareSync(req.body.password, physicianInDatabase.hashedPassword)) {
        const token = jwt.encode({ email: physicianInDatabase.email }, secret);
        //update physician's last access time
        physicianInDatabase.lastAccess = new Date();
        physicianInDatabase.save().then(response => {
          console.log("Physician's LastAccess has been updated.");
        });
        // Send back a token that contains the physician's username
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
