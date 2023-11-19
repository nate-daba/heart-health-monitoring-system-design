import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import mongoose from 'mongoose';
import express from 'express';
import cors from "cors";
import UserRouter from './routes/user.router';
import PhysicianRouter from './routes/physician.router';
import MeasurementRouter from './routes/measurement.router';
import DeviceRouter from './routes/device.router';
import {dbConnect} from './configs/database.config'
dbConnect();

const app = express();

// mongoose.connect('mongodb://127.0.0.1/heart2')
//     .then(() => console.log('Connected to MongoDB...'))
//     .catch((err: any) => console.error('Could not connect to MongoDB...', err));

app.use(express.json());
app.use(cors({ // why to use cors: https://youtu.be/Y28hObRey9g?t=413
    credentials:true,
    origin:["http://localhost:4200"]
}));
app.use("/api/users", UserRouter);
app.use("/api/physicians", PhysicianRouter);
app.use("/api/measurements", MeasurementRouter);
app.use("/api/devices", DeviceRouter);

app.use(express.static('public'));
app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname,'public', 'index.html'))
})

const port = 5000
app.listen(port, () => {
    console.log("Website served on http://localhost:" + port);
})