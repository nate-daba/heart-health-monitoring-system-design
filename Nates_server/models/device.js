const db = require("../db");

const deviceSchema = new db.Schema({
    deviceId:   String,
    email:      String,
 });

 const Device = db.model("Device", deviceSchema);

module.exports = Device;