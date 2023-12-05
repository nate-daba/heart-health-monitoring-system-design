const db = require("../db");

const userSchema = new db.Schema({
    firstName:      String,
    lastName:       String,
    email:          String,
    physicianEmail: String,
    hashedPassword:   String,
    lastAccess:     { type: Date, default: Date.now },
 });

 const User = db.model("User", userSchema);

module.exports = User;