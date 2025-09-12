const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
     fullname: {type: String, required:true,trim:true},
     email: {type: String, required:true, unique: true, lowercase: true},
     mobile:{type: String, required: false},
     password: {type: String, required: false},
     googleId: {type: String, required: false},
     referralCode: { type: String,required:false},
     isBlocked: {type: Boolean, default: false},
     role:{type:String,enum:['user','admin'],default:'user'}
    },
     { timestamps:true}  
);

module.exports = mongoose.model('User',userSchema);