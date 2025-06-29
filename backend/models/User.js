const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  phone:{
    type:String,
    required:false,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetToken:String,
  resetTokenExpiration :Date,
  
});

module.exports = mongoose.model('User', userSchema); 