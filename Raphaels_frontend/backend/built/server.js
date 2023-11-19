"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var path_1 = __importDefault(require("path"));
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var user_router_1 = __importDefault(require("./routes/user.router"));
var physician_router_1 = __importDefault(require("./routes/physician.router"));
var measurement_router_1 = __importDefault(require("./routes/measurement.router"));
var database_config_1 = require("./configs/database.config");
(0, database_config_1.dbConnect)();
var app = (0, express_1.default)();
// mongoose.connect('mongodb://127.0.0.1/heart2')
//     .then(() => console.log('Connected to MongoDB...'))
//     .catch((err: any) => console.error('Could not connect to MongoDB...', err));
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    credentials: true,
    origin: ["http://localhost:4200"]
}));
app.use("/api/users", user_router_1.default);
app.use("/api/physicians", physician_router_1.default);
app.use("/api/measurement", measurement_router_1.default);
app.use(express_1.default.static('public'));
app.get('*', function (req, res) {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
var port = 5000;
app.listen(port, function () {
    console.log("Website served on http://localhost:" + port);
});
