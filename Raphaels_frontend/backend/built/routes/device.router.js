"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_async_handler_1 = __importDefault(require("express-async-handler"));
var express_1 = require("express");
var device_model_1 = require("../models/device.model");
var axios_1 = __importDefault(require("axios"));
var qs_1 = __importDefault(require("qs"));
var router = (0, express_1.Router)();
var device;
router.get('/', (0, express_async_handler_1.default)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.send('respond with a resource');
        return [2 /*return*/];
    });
}); }));
router.post('/register', (0, express_async_handler_1.default)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, deviceId, email, newDevice, dbDevice, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, deviceId = _a.deviceId, email = _a.email;
                // Validate the input
                if (!deviceId || !email) {
                    res.status(400).json({ message: 'Bad request: Device ID and email are required.' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, device_model_1.DeviceModel.findOne({ deviceId: deviceId })];
            case 1:
                device = _b.sent();
                if (device) {
                    res.status(400).send("Device already registered.");
                    return [2 /*return*/];
                }
                newDevice = new device_model_1.DeviceModel({
                    deviceId: deviceId,
                    email: email
                });
                return [4 /*yield*/, device_model_1.DeviceModel.create(newDevice)];
            case 2:
                dbDevice = _b.sent();
                // Send a 201 response if the device is successfully saved
                res.status(201).json({ message: 'Device registered successfully.' });
                alert('Device registered successfully.');
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                console.error('Registration error:', error_1);
                // Check for validation errors (assuming the use of Mongoose)
                if (error_1.name === 'ValidationError') {
                    res.status(400).json({ message: 'Bad request: Invalid device data.', errors: error_1.errors });
                    return [2 /*return*/];
                }
                // If the error code is 11000, it indicates a duplicate key error
                if (error_1.code === 11000) {
                    res.status(400).json({ message: 'Bad request: Device already registered.' });
                    return [2 /*return*/];
                }
                // Handle unauthorized errors
                if (error_1.name === 'UnauthorizedError') {
                    res.status(401).json({ message: 'Unauthorized: Invalid credentials.' });
                    return [2 /*return*/];
                }
                // Generic error message for other cases
                res.status(500).json({ message: 'Internal server error: Unable to register device.' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); }));
// https://docs.particle.io/reference/cloud-apis/api/#create-a-webhook
router.post('/createWebhook', (0, express_async_handler_1.default)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    // Function to create a webhook
    function createWebhook(eventType) {
        return __awaiter(this, void 0, void 0, function () {
            var data, config, response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = qs_1.default.stringify({
                            'integration_type': req.body.integration_type,
                            'event': eventType,
                            'url': req.body.url,
                            'requestType': req.body.requestType
                        });
                        config = {
                            method: 'post',
                            maxBodyLength: Infinity,
                            url: 'https://api.particle.io/v1/integrations',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Authorization': 'Bearer ' + req.headers["x-auth"]
                            },
                            data: data
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios_1.default.request(config)];
                    case 2:
                        response = _a.sent();
                        console.log("Webhook for ".concat(eventType, " data created successfully!"));
                        return [2 /*return*/, response.data]; // Return the response data
                    case 3:
                        error_3 = _a.sent();
                        throw error_3; // Throw the error to be caught by the caller
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    var heartrateResponse, spo2Response, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log(req.body);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, createWebhook('heartrate')];
            case 2:
                heartrateResponse = _a.sent();
                return [4 /*yield*/, createWebhook('spo2')];
            case 3:
                spo2Response = _a.sent();
                // Send the response back to the client
                res.json({
                    heartrateResponse: heartrateResponse,
                    spo2Response: spo2Response
                });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _a.sent();
                console.error('An error occurred:', error_2);
                res.status(500).send('An error occurred while creating webhooks.');
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); }));
