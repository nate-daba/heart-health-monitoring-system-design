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
var physician_model_1 = require("../models/physician.model");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var router = (0, express_1.Router)();
var physician;
router.post('/login', (0, express_async_handler_1.default)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, email = _a.email, password = _a.password;
                return [4 /*yield*/, physician_model_1.PhysicianModel.findOne({ email: email })];
            case 1:
                // 1. const user = sample_users.find(user => user.email === body.email &&
                //     user.password === body.password);
                physician = _c.sent();
                _b = physician;
                if (!_b) return [3 /*break*/, 3];
                return [4 /*yield*/, bcryptjs_1.default.compare(password, physician.password)];
            case 2:
                _b = (_c.sent());
                _c.label = 3;
            case 3:
                if (_b) {
                    console.log('b4 genTknResp');
                    console.log(physician);
                    res.send(generateTokenResponse(physician));
                }
                else {
                    res.status(400).send("Email or password are invalid.");
                }
                return [2 /*return*/];
        }
    });
}); }));
router.post('/register', (0, express_async_handler_1.default)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, first_name, last_name, email, password, address, encryptedPassword, newPhysician, dbPhysician;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log('in register');
                _a = req.body, first_name = _a.first_name, last_name = _a.last_name, email = _a.email, password = _a.password, address = _a.address;
                console.log(email, ", ", password);
                return [4 /*yield*/, physician_model_1.PhysicianModel.findOne({ email: email })];
            case 1:
                physician = _b.sent();
                if (physician) {
                    res.status(400).send("Physician already exists, please login.");
                    return [2 /*return*/];
                }
                return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
            case 2:
                encryptedPassword = _b.sent();
                newPhysician = new physician_model_1.PhysicianModel({
                    first_name: first_name,
                    last_name: last_name,
                    email: email.toLowerCase(),
                    password: encryptedPassword,
                    address: address
                });
                return [4 /*yield*/, physician_model_1.PhysicianModel.create(newPhysician)];
            case 3:
                dbPhysician = _b.sent();
                res.send(generateTokenResponse(dbPhysician));
                alert(generateTokenResponse(dbPhysician));
                return [2 /*return*/];
        }
    });
}); }));
var generateTokenResponse = function (physician) {
    var token = jsonwebtoken_1.default.sign(//generate a token = sign a token
    { email: physician.email }, "SecretKey", { expiresIn: "30d" });
    return {
        email: physician.email,
        first_name: physician.first_name,
        last_name: physician.last_name,
        address: physician.address,
        token: token
    };
};
exports.default = router;
