const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    participants: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'admin',
    },
    userName: {
      type: String,
      required: function () {
        return this.chatType === 'aduse' || this.chatType === 'comuse';
      },
    },
    chatType: {
      type: String,
      enum: ['adcom', 'aduse', 'comuse'],
      required: true,
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: function () {
        return this.chatType === 'adcom' || this.chatType === 'comuse';
      },
    },
    companyName: {
      type: String,
      required: function () {
        return this.chatType === 'adcom' || this.chatType === 'comuse';
      },
    },
    messages: [
      {
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
