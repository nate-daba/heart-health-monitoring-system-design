import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import { User, UserModel } from '../models/user.model';
import { HeartRateModel } from '../models/heart-rate.model';
import bcrypt from 'bcryptjs';
import axios from 'axios';

const router = Router();

var user:any;

router.post('/login', asyncHandler(
    async (req, res) => {
        // 1. const body = req.body;
        const {email, password} = req.body; // alternatively (Destructuring Assignment)
        // 1. const user = sample_users.find(user => user.email === body.email &&
        //     user.password === body.password);
        const user = await UserModel.findOne({email});
        
        if(user && (await bcrypt.compare(password,user.password))){
            console.log('b4 genTknResp');
            console.log(user);
            res.send(generateTokenResponse(user));
        } else {
            res.status(404).send("Email or password are invalid.");
        }
}))

router.post('/register', asyncHandler(
    async (req, res) => {
        console.log('in register')
        const {first_name, last_name, email, password, address} = req.body;
        console.log(email, ", ", password)
        user = await UserModel.findOne({email});
        if (user) {
            res.status(400).send("User already exists, please login.");
            return;
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        const newUser = new UserModel ({
            //id:'',
            first_name, // if 'name: name', you can just write 'name'
            last_name,
            email: email.toLowerCase(),
            password: encryptedPassword,
            address,
            isAdmin: false,
            heartRateData: [ 
                { sensorValue: 111,
                timeStamp: new Date() }
            ]
        })

        const dbUser = await UserModel.create(newUser);
        res.send(generateTokenResponse(dbUser));
        alert(generateTokenResponse(dbUser))
        // res.send(dbUser);
    }
))

const generateTokenResponse = (user: User) => {
    const token = jwt.sign( //generate a token = sign a token
        { //id: user.id, 
            email:user.email, isAdmin:user.isAdmin }, 
        "SecretKey",
        { expiresIn: "30d"}
    );

    return {
        //id: user.id,
        email:user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        address: user.address,
        isAdmin: user.isAdmin,
        token: token,
        heartRateData: user.heartRateData
    };
}

export default router;

const accessToken = "3923315920a08f34632580858dfa793e619df985";
const deviceId = "e00fce68324153a783dcc4f7";

// Subscribe to the "sensorData" event
// axios causes the huge print on Terminal when backend starts
//This block was commented out on 10/24/23:
// axios.post(`https://api.particle.io/v1/devices/${deviceId}/events`, {
//   name: "sensorData",
//   auth: accessToken,
// })
// .then((response) => {
//     console.log("Subscribed to sensorData event");
// })
// .catch((error) => {
//     console.error("Failed to subscribe to sensorData event", error);
// });

// Listen for incoming events
//This block was commented out on 10/24/23:
// const Particle = require("particle-api-js");
// const particle = new Particle();
// let i = 1;

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

//This block was commented out on 10/24/23:
// async function startParticleStream() {
//     const eventStream = particle.getEventStream({
//         deviceId: deviceId,
//         auth: accessToken,
//     });
    
//         console.log("Listening for events...");
//         eventStream.on("event", async (event: any) => {
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
        
//         });
// }