// to use MongoDB
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://MeTheOnly:GuteArbeit891234@ece513project.ldg8mzo.mongodb.net/hearto2monitor?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology:true });

module.exports = mongoose;