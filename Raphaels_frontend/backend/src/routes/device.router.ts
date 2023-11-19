import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import { Device, DeviceModel } from '../models/device.model';
import axios from 'axios';
import qs from 'qs';

const router = Router();
var device:any;

router.get('/', asyncHandler(
    async (req, res) => {
        res.send('respond with a resource');
    }
))

router.post('/register', asyncHandler(
    async (req, res) => {
        try {
            // Destructure the body for better readability
            const {deviceId, email} = req.body;
        
            // Validate the input
            if (!deviceId || !email) {
               res.status(400).json({ message: 'Bad request: Device ID and email are required.' });
               return;
            }

            device = await DeviceModel.findOne({deviceId});
            if (device) {
                res.status(400).send("Device already registered.");
                return;
            }

            // Initialize the new device
            const newDevice = new DeviceModel ({
              deviceId, // if 'deviceId: deviceId', you can just write 'deviceId'
              email
            });
        
            // Save the new device to the database
            const dbDevice = await DeviceModel.create(newDevice);
        
            // Send a 201 response if the device is successfully saved
            res.status(201).json({ message: 'Device registered successfully.' });
            alert('Device registered successfully.')
        
        } catch (error : any) {
            console.error('Registration error:', error);
        
            // Check for validation errors (assuming the use of Mongoose)
            if (error.name === 'ValidationError') {
               res.status(400).json({ message: 'Bad request: Invalid device data.', errors: error.errors });
               return;
            }
        
            // If the error code is 11000, it indicates a duplicate key error
            if (error.code === 11000) {
               res.status(400).json({ message: 'Bad request: Device already registered.' });
               return;
            }
        
            // Handle unauthorized errors
            if (error.name === 'UnauthorizedError') {
              res.status(401).json({ message: 'Unauthorized: Invalid credentials.' });
              return;
            }
        
            // Generic error message for other cases
            res.status(500).json({ message: 'Internal server error: Unable to register device.' });
        }
    }
))

// https://docs.particle.io/reference/cloud-apis/api/#create-a-webhook
router.post('/createWebhook', asyncHandler(
    async (req, res) => {
        console.log(req.body);
  
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