const db = require("../db");

const patientSchema = new db.Schema({
    firstName:      String,
    lastName:       String,
    email:          String,
    physicianEmail: String,
    hashedPassword:   String,
    lastAccess:     { type: Date, default: Date.now },
 });

 const Patient = db.model("Patient", patientSchema);

module.exports = Patient;