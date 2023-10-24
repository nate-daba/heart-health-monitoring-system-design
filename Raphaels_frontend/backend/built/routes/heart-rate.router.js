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
var heart_rate_model_1 = require("../models/heart-rate.model");
var axios_1 = __importDefault(require("axios"));
var accessToken = "3923315920a08f34632580858dfa793e619df985";
var deviceId = "e00fce68324153a783dcc4f7";
// Subscribe to the "sensorData" event
axios_1.default.post("https://api.particle.io/v1/devices/".concat(deviceId, "/events"), {
    name: "sensorData",
    auth: accessToken,
})
    .then(function (response) {
    console.log("Subscribed to sensorData event");
})
    .catch(function (error) {
    console.error("Failed to subscribe to sensorData event", error);
});
// Listen for incoming events
var Particle = require("particle-api-js");
var particle = new Particle();
particle.getEventStream({
    deviceId: deviceId,
    auth: accessToken,
})
    .then(function (stream) {
    console.log("Listening for events...");
    stream.on("event", function (event) {
        if (event.name === "sensorData") {
            var data = JSON.parse(event.data);
            console.log("Received sensor data:", data);
            // Store the data in your MongoDB database or perform any other actions
            var sensorValue = data.sensorValue;
            console.log("sensorValue = ", sensorValue);
            var newSensorData = new heart_rate_model_1.HeartRateModel({
                sensorValue: sensorValue,
                timeStamp: new Date(), // Use the current date and time as the timestamp
            });
            newSensorData.save()
                .then(function () { return console.log('Sensor data saved to MongoDB'); })
                .catch(function (error) { return console.error('Error saving sensor data:', error); });
        }
    });
})
    .catch(function (error) {
    console.error("Error getting event stream", error);
});
var router = (0, express_1.Router)();
router.post('/', (0, express_async_handler_1.default)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sensorValue, newData;
    return __generator(this, function (_a) {
        sensorValue = req.body.sensorValue;
        newData = new heart_rate_model_1.HeartRateModel({ sensorValue: sensorValue });
        newData.save();
        res.sendStatus(200);
        return [2 /*return*/];
    });
}); }));
exports.default = router;
