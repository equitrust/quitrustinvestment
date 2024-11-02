const Notification = require('../model/notification');
const User = require("../model/usermodel");
const Admin = require("../model/admin");
// Create a new notification
const createNotification = async (req, res) => {
    try {
        const { message, user, type } = req.body;

        if (!message || !user || !type) {
            return res.status(400).json({ error: 'Message, user, and type are required.' });
        }

        // Check if the user exists
        const userExists = await Admin.findById(user);
        if (!userExists) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const notification = new Notification({ message, user, type });
        await notification.save();

        // Update user's notification count
        //await User.findByIdAndUpdate(user, { $inc: { notificationsCount: 1 } });

        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all notifications for a user
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.params.userId;
    
        // Fetch the user details
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).render('error', { message: 'User not found' });
        }
    
        // Fetch notifications for the user
        const notifications = await Notification.find().sort({ createdAt: -1 });

        res.render('admin/html/notification', { notifications, user });
    } catch (error) {
        res.status(500).render('error', { message: error.message });
    }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found.' });
        }

        if (notification.read) {
            return res.status(400).json({ error: 'Notification already read.' });
        }

        notification.read = true;
        await notification.save();

        // Update user's notification count
        const user = await User.findById(notification.user);
        if (user) {
            await User.findByIdAndUpdate(notification.user, { $inc: { notificationsCount: -1 } });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = 
{
    createNotification,
    getUserNotifications,
    markAsRead
}
