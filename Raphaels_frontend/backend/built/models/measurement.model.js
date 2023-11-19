"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeasurementModel = exports.MeasurementSchema = void 0;
var mongoose_1 = require("mongoose");
// export interface HeartRate {
//     sensorValue: number;
//     timeStamp: Date;
// }
exports.MeasurementSchema = new mongoose_1.Schema({
    eventName: String,
    data: { heartrate: Number, spo2: Number },
    deviceId: String
    //published_at: Date // this should later be changed to measurementTime
    //measurementTime: Date
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
exports.MeasurementModel = (0, mongoose_1.model)('measurement', exports.MeasurementSchema, 'data');
