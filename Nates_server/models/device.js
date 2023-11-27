const db = require('../db');

const deviceSchema = new db.Schema({
    deviceId: String,
    email: String,
    accessToken: String,
    registeredOn: { type: Date, default: Date.now },
    deviceName: String,
    measurementFrequency: { type: Number, default: 30 }, // Default to 30 minutes
    timeOfDayRangeOfMeasurements: { 
        startTime: { type: String, default: '06:00' }, // Default to 6:00 AM
        endTime: { type: String, default: '22:00' } // Default to 10:00 PM
    },
});

const Device = db.model("Device", deviceSchema);

module.exports = Device;
