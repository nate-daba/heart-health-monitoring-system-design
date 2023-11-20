"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceModel = exports.DeviceSchema = void 0;
var mongoose_1 = require("mongoose");
exports.DeviceSchema = new mongoose_1.Schema({
    deviceId: { type: String, required: true },
    email: { type: String, required: true }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
exports.DeviceModel = (0, mongoose_1.model)('device', exports.DeviceSchema);
