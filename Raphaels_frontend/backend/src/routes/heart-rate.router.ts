import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import { HeartRateModel } from '../models/heart-rate.model';
import { User, UserModel } from '../models/user.model';
import axios from 'axios';
import qs from 'qs';

//const accessToken = "3923315920a08f34632580858dfa793e619df985";
//const deviceId = "e00fce68324153a783dcc4f7";

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
));

router.post('/createWebhook', asyncHandler(
    async (req, res) => {
        console.log(req.body);
    
        //physician = await PhysicianModel.findOne({email});

        // Function to create a webhook
        async function createWebhook(eventType: any) {
            let data = qs.stringify({
                'integration_type': req.body.integration_type,
                'event': eventType,
                'url': req.body.url,
                'requestType': req.body.requestType
            });
    
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://api.particle.io/v1/integrations',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer ' + req.headers["x-auth"]
                },
                data: data
            };
    
            try {
                const response = await axios.request(config);
                console.log(`Webhook for ${eventType} data created successfully!`);
                return response.data; // Return the response data
            } catch (error) {
                throw error; // Throw the error to be caught by the caller
            }
        }
    
        try {
            // Create the first webhook for 'heartrate'
            const heartrateResponse = await createWebhook('heartrate');
    
            // Create the second webhook for 'spo2'
            const spo2Response = await createWebhook('spo2');
    
            // Send the response back to the client
            res.json({
                heartrateResponse,
                spo2Response
            });
        } catch (error) {
            console.error('An error occurred:', error);
            res.status(500).send('An error occurred while creating webhooks.');
        }

    }
));

export default router;