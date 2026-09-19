const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    CompanyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    bar: {
        content: String
    }
}, { timestamps: true });

const Notification = mongoose.model('notification', notificationSchema);
module.exports = Notification;
