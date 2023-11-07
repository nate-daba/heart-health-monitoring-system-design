import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import { HeartRateModel } from '../models/heart-rate.model';
import { User, UserModel } from '../models/user.model';
import axios from 'axios';

const accessToken = "3923315920a08f34632580858dfa793e619df985";
const deviceId = "e00fce68324153a783dcc4f7";

// Subscribe to the "sensorData" event
// axios.post... causes the huge printout on Terminal (maybe delete it)
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
// particle.getEventStream({
//     deviceId: deviceId,
//     auth: accessToken,
//   })
//   .then((stream: any) => {
//     console.log("Listening for events...");
  
//     stream.on("event", (event: any) => {
//       if (event.name === "sensorData") {
//         const data = JSON.parse(event.data);
//         console.log("Received sensor data:", data);
//         // Store the data in your MongoDB database or perform any other actions
//         const sensorValue = data.sensorValue;
//         console.log("sensorValue = ", sensorValue);
//         const newSensorData = new HeartRateModel({
//             sensorValue: sensorValue,
//             timeStamp: new Date(), // Use the current date and time as the timestamp
//         });
//         newSensorData.save()
//           .then(() => console.log('Sensor data saved to MongoDB'))
//           .catch((error) => console.error('Error saving sensor data:', error));
//       }
//     });
//   })
//   .catch((error: any) => {
//     console.error("Error getting event stream", error);
//   });

const router = Router();

router.post('/', asyncHandler(
    async (req, res) => {
        const { sensorValue } = req.body;

        // Store the data in your MongoDB database
        const newData = new HeartRateModel({ sensorValue });
        newData.save();

        res.sendStatus(200);
    }
))

export default router;