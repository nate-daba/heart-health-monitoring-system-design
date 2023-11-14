const db = require('../db');

const sensorDataSchema = new db.Schema({
    eventName: String,
    heartrate: Number,
    spo2: Number,
    deviceId: String,
    published_at: Date
});

const sensorData = db.model('sensorData', sensorDataSchema, 'data');

module.exports = sensorData;