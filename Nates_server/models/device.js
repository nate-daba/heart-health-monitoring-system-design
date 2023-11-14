const db = require("../db");

const deviceSchema = new db.Schema({
    deviceId:   String,
    name:       String,
    connected:  Boolean,
    online:     Boolean,
 });

 const Device = db.model("Device", deviceSchema);

module.exports = Device;