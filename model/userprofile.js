const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  //public_key: String,
  username: String,
  bank_name: String,
  bank_account: Number,
  bio: String,
  isprofile:  {
    type: Boolean,
    default: null,
},
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User model
  createdAt: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
