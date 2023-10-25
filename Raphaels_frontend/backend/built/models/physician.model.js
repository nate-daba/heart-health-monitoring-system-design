"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicianModel = exports.PhysicianSchema = void 0;
var mongoose_1 = require("mongoose");
exports.PhysicianSchema = new mongoose_1.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    isAdmin: { type: Boolean, required: true },
    patients: { type: [], required: true }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
exports.PhysicianModel = (0, mongoose_1.model)('physician', exports.PhysicianSchema);
