"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeartRateModel = exports.HeartRateSchema = void 0;
var mongoose_1 = require("mongoose");
// export interface HeartRate {
//     sensorValue: number;
//     timeStamp: Date;
// }
exports.HeartRateSchema = new mongoose_1.Schema({
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
exports.HeartRateModel = (0, mongoose_1.model)('heart-rate', exports.HeartRateSchema);
