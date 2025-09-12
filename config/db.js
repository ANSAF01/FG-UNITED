//this file is used to handle mongoDB connection

const mongoose = require('mongoose')

mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>console.log('MOngoDB Connected'))
    .catch((err)=>console.error('MongoDB connection error:',err));

module.exports = mongoose;