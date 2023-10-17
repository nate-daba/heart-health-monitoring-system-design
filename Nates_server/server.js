/// This code was copied from ChatGPT:
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000; // Choose the port you want to run the server on

// Middleware to parse JSON data
app.use(bodyParser.json());

// POST endpoint to receive data from Particle webhook
app.post('/webhook', (req, res) => {
  const eventData = req.body; // This will contain the data sent by the Particle webhook

  // Process and handle the received data as needed
  // You can save it to a database, perform actions, etc.

  console.log('Received data from Particle webhook:', eventData);
  res.status(200).send('Data received.'); // Send a response to acknowledge receipt
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
