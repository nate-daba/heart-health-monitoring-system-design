"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeasurementModel = exports.MeasurementSchema = void 0;
var mongoose_1 = require("mongoose");

exports.MeasurementSchema = new mongoose_1.Schema({
    sensorValue: { type: Number, required: true },
    timeStamp: { type: Date, required: true }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
exports.MeasurementModel = (0, mongoose_1.model)('measurement', exports.MeasurementSchema);
