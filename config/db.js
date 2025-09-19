const mongoose = require('mongoose')

mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>console.log('MongoDB Connected'))
    .catch((err)=>console.error('MongoDB connection error:',err));

module.exports = mongoose;    