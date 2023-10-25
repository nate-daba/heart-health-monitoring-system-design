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
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var express_async_handler_1 = __importDefault(require("express-async-handler"));
var express_1 = require("express");
var user_model_1 = require("../models/user.model");
var heart_rate_model_1 = require("../models/heart-rate.model");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var axios_1 = __importDefault(require("axios"));
var router = (0, express_1.Router)();
var user;
router.post('/login', (0, express_async_handler_1.default)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, email = _a.email, password = _a.password;
                return [4 /*yield*/, user_model_1.UserModel.findOne({ email: email })];
            case 1:
                // 1. const user = sample_users.find(user => user.email === body.email &&
                //     user.password === body.password);
                user = _c.sent();
                _b = user;
                if (!_b) return [3 /*break*/, 3];
                return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password)];
            case 2:
                _b = (_c.sent());
                _c.label = 3;
            case 3:
                if (_b) {
                    console.log('b4 genTknResp');
                    console.log(user);
                    res.send(generateTokenResponse(user));
                }
                else {
                    res.status(404).send("Email or password are invalid.");
                }
                return [2 /*return*/];
        }
    });
}); }));
router.post('/register', (0, express_async_handler_1.default)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, first_name, last_name, email, password, address, encryptedPassword, newUser, dbUser;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log('in register');
                _a = req.body, first_name = _a.first_name, last_name = _a.last_name, email = _a.email, password = _a.password, address = _a.address;
                console.log(email, ", ", password);
                return [4 /*yield*/, user_model_1.UserModel.findOne({ email: email })];
            case 1:
                user = _b.sent();
                if (user) {
                    res.status(400).send("User already exists, please login.");
                    return [2 /*return*/];
                }
                return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
            case 2:
                encryptedPassword = _b.sent();
                newUser = new user_model_1.UserModel({
                    //id:'',
                    first_name: first_name,
                    last_name: last_name,
                    email: email.toLowerCase(),
                    password: encryptedPassword,
                    address: address,
                    isAdmin: false,
                    heartRateData: [
                        { sensorValue: 111,
                            timeStamp: new Date() }
                    ]
                });
                return [4 /*yield*/, user_model_1.UserModel.create(newUser)];
            case 3:
                dbUser = _b.sent();
                res.send(generateTokenResponse(dbUser));
                alert(generateTokenResponse(dbUser));
                return [2 /*return*/];
        }
    });
}); }));
var generateTokenResponse = function (user) {
    var token = jsonwebtoken_1.default.sign(//generate a token = sign a token
    {
        email: user.email, isAdmin: user.isAdmin
    }, "SecretKey", { expiresIn: "30d" });
    return {
        //id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        address: user.address,
        isAdmin: user.isAdmin,
        token: token,
        heartRateData: user.heartRateData
    };
};
exports.default = router;
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
var i = 1;
// async function startParticleStream() {
// particle.getEventStream({
//     deviceId: deviceId,
//     auth: accessToken,
// })
//     .then((stream: any) => {
//         console.log("Listening for events...");
//         stream.on("event", (event: any) => {
//         if (event.name === "sensorData") {
//             const data = JSON.parse(event.data);
//             console.log("Received sensor data:", data);
//             // Store the data in your MongoDB database or perform any other actions
//             const sensorValue = data.sensorValue;
//             console.log("sensorValue = ", sensorValue);
//             const newSensorData = new HeartRateModel({
//                 sensorValue: sensorValue,
//                 timeStamp: new Date(), // Use the current date and time as the timestamp
//             });
//             newSensorData.save()
//             .then(() => console.log('Sensor data saved to MongoDB'))
//             .catch((error) => console.error('Error saving sensor data:', error));
//             setTimeout(() => {
//                 console.log('Processing next event after delay...');
//               }, 3000);
//             i++;
//         }
//         console.log('i = ' + i);
//         if (i > 2) {
//             stream.unsubscribe();
//             console.log('Event stream unsubscribed.');
//         }
//         });
//     })
//     .catch((error: any) => {
//         console.error("Error getting event stream", error);
//     });
// }
// function stopParticleStream() {
//     particle.
// }
function startParticleStream() {
    return __awaiter(this, void 0, void 0, function () {
        var eventStream;
        var _this = this;
        return __generator(this, function (_a) {
            eventStream = particle.getEventStream({
                deviceId: deviceId,
                auth: accessToken,
            });
            console.log("Listening for events...");
            eventStream.on("event", function (event) { return __awaiter(_this, void 0, void 0, function () {
                var data, sensorValue, newSensorData;
                return __generator(this, function (_a) {
                    if (event.name === "sensorData") {
                        data = JSON.parse(event.data);
                        console.log("Received sensor data:", data);
                        sensorValue = data.sensorValue;
                        console.log("sensorValue = ", sensorValue);
                        newSensorData = new heart_rate_model_1.HeartRateModel({
                            sensorValue: sensorValue,
                            timeStamp: new Date(), // Use the current date and time as the timestamp
                        });
                        newSensorData.save()
                            .then(function () { return console.log('Sensor data saved to MongoDB'); })
                            .catch(function (error) { return console.error('Error saving sensor data:', error); });
                        setTimeout(function () {
                            console.log('Processing next event after delay...');
                        }, 3000);
                        i++;
                    }
                    console.log('i = ' + i);
                    return [2 /*return*/];
                });
            }); });
            return [2 /*return*/];
        });
    });
}
