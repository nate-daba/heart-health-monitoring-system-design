import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import { MeasurementModel } from '../models/measurement.model';
import { User, UserModel } from '../models/user.model';
import axios from 'axios';
import qs from 'qs';

const router = Router();

router.post('/', asyncHandler(
    async (req, res) => {
        const { measurement } = req.body;

        // Store the data in your MongoDB database
        const newData = new MeasurementModel({ measurement });
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