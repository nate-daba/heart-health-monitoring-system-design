var express = require('express');
var router = express.Router();
const axios = require('axios');
const qs = require('qs');

// https://docs.particle.io/reference/cloud-apis/api/#create-a-webhook
router.post('/createWebhook', async function(req, res){
    console.log(req.body);
  
    // Function to create a webhook
    async function createWebhook(eventType) {
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
  });

  module.exports = router;
  
  