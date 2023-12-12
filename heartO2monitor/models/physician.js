const db = require("../db");

const physicianSchema = new db.Schema({
    firstName: String,
    lastName: String,
    email: String,
    specialty: String,
    hashedPassword: String,
    patients: [
        {
            type: db.Schema.Types.ObjectId,
            ref: 'User' // Linking to the User model
        }
    ],
    lastAccess: { type: Date, default: Date.now },
});

 const Physician = db.model("Physician", physicianSchema);

module.exports = Physician;