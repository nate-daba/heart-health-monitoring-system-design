const db = require('../db');

const sensorDataSchema = new db.Schema({
    eventName: String,
    data: {heartrate: Number, spo2: Number},
    deviceId: String,
    published_at: Date, // this should later be changed to measurementTime
    measurementTime: Date
});

const sensorData = db.model('sensorData', sensorDataSchema, 'data');

module.exports = sensorData;