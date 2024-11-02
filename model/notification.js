const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['message', 'alert', 'reminder'], // Example types
        required: true
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
