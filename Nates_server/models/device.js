const db = require("../db");

const deviceSchema = new db.Schema({
    deviceId:   String,
    email:      String,
    accessToken: String,
    registeredOn: Date,
 });

 const Device = db.model("Device", deviceSchema);

module.exports = Device;