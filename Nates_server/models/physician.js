const db = require("../db");

const physicianSchema = new db.Schema({
    firstName:      String,
    lastName:       String,
    email:          String,
    hashedPassword:   String,
    lastAccess:     { type: Date, default: Date.now },
 });

 const Physician = db.model("Physician", physicianSchema);

module.exports = Physician;