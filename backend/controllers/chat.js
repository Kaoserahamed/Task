const Chat = require('../models/Chat');

const logger = require('../utils/logger');

exports.getChat = async (req, res) => {
  try {
    const { companyId } = req.params;
    const chatType = req.query;
    logger.info('পারামস', companyId);
    logger.info(chatType.query);
    const chat = await Chat.find({
      companyId,
      chatType: chatType.query,
    })
      .select(
        'chatType participants messages userName companyName lastMessage lastMessageTime unreadCount companyId'
      )
      .populate('messages');
    res.status(200).json(chat);
    logger.info(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAdminchat = async (req, res) => {
  try {
    const chatType = req.query;
    logger.info(chatType.query);
    const chat = await Chat.find({
      chatType: chatType.query,
    })
      .select(
        'chatType participants messages userName companyName lastMessage lastMessageTime unreadCount companyId'
      )
      .populate('participants')
      .populate('messages');

    res.status(200).json(chat);
    logger.info(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getuserChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const chatType = req.query;
    logger.info(chatType);
    logger.info('স্পপ্সপ্স');
    const chat = await Chat.find({
      participants: userId,
      chatType: chatType.query,
    })
      .select(
        'chatType participants messages companyName lastMessage lastMessageTime unreadCount companyId'
      )
      .populate('companyId')
      .populate('messages');
    const io = require('../socket').getIO();
    io.emit('posts', {
      action: 'userchat',
      chat,
    });

    logger.info(chat);

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.fetchChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).populate('messages').populate('companyName');
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.usersendMessage = async (req, res) => {
  try {
    // chatId and companyId are reassigned below (temporary chat id handling)
    // so they stay `let`; everything else is read-only.
    let { chatId, companyId } = req.body;
    const { content, senderId, chatType, companyName, userName, adminId, userId } = req.body;
    logger.info('Received message request:', {
      chatId,
      content,
      senderId,
      companyName,
      userName,
      chatType,
      companyId,
    });

    let chat;

    // Check if it's a new chat request (chatId is null or a temporary ID)
    if (chatId === null || (typeof chatId === 'string' && chatId.startsWith('temp_'))) {
      if (typeof chatId === 'string' && chatId.startsWith('temp_')) {
        companyId = chatId.substring(5);
        logger.info('Temporary chatId detected, extracted companyId:', companyId);
      }

      if (!chat) {
        logger.info('Creating new chat...');
        chat = new Chat({
          participants: userId,
          chatType,
          userName,
          companyName,
          companyId,
          adminId,
          messages: [], // Start with an empty messages array
        });
        await chat.save();
        logger.info('New chat created with ID:', chat._id);
      }
      // Update chatId with the real chat ID for the new message
      chatId = chat._id;
    } else {
      chat = await Chat.findById(chatId);
    }

    if (chat) {
      logger.info('Chat object before adding message:', chat);
      logger.info(senderId);
      const newMessage = {
        senderId,
        content,
        timestamp: new Date(),
      };

      chat.messages.push(newMessage);
      chat.lastMessage = content;
      chat.lastMessageTime = new Date();
      chat.unreadCount += 1;

      await chat.save();

      const updatedChat = await Chat.findById(chat._id)

        .populate('messages');

      // Emit socket event to all connected clients
      const io = require('../socket').getIO();
      io.emit('posts', {
        action: 'create',
        updatedChat,
      });

      res.status(200).json(updatedChat);
    } else {
      // This case should ideally not be reached if logic is correct,
      // but included as a fallback.
      logger.error('Error: Chat object is null after processing.');
      res.status(404).json({ message: 'Chat not found after processing ID.' });
    }
  } catch (error) {
    logger.error('Error in usersendMessage catch block:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};
