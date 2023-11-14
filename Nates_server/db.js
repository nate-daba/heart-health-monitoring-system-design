// to use MongoDB
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://MeTheOnly:GuteArbeit891234@ece513project.ldg8mzo.mongodb.net/sensorData?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology:true });

module.exports = mongoose;