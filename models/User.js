const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Password compare method
userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User',userSchema);