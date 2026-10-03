const Chat = require('../models/Chat');

const logger = require('../utils/logger');

exports.getChat = async (req, res) => {
  try {
    const { companyId } = req.params;
    const chatType = req.query;
    logger.info(
      { event: 'chat.list.company', companyId, chatType: chatType.query },
      'listing company chats'
    );
    const chat = await Chat.find({
      companyId,
      chatType: chatType.query,
    })
      .select(
        'chatType participants messages userName companyName lastMessage lastMessageTime unreadCount companyId'
      )
      .populate('messages');
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAdminchat = async (req, res) => {
  try {
    const chatType = req.query;
    logger.info({ event: 'chat.list.admin', chatType: chatType.query }, 'listing admin chats');
    const chat = await Chat.find({
      chatType: chatType.query,
    })
      .select(
        'chatType participants messages userName companyName lastMessage lastMessageTime unreadCount companyId'
      )
      .populate('participants')
      .populate('messages');

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getuserChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const chatType = req.query;
    logger.info(
      { event: 'chat.list.user', userId, chatType: chatType.query },
      'listing user chats'
    );
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
    logger.info(
      { event: 'chat.message.received', chatId, senderId, chatType, companyId, userId },
      'chat message received'
    );

    let chat;

    // Check if it's a new chat request (chatId is null or a temporary ID)
    if (chatId === null || (typeof chatId === 'string' && chatId.startsWith('temp_'))) {
      if (typeof chatId === 'string' && chatId.startsWith('temp_')) {
        companyId = chatId.substring(5);
        logger.info(
          { event: 'chat.temp-id.resolved', companyId },
          'temporary chat id resolved to a company'
        );
      }

      if (!chat) {
        logger.info({ event: 'chat.create', companyId, chatType }, 'creating a chat');
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
        logger.info({ event: 'chat.created', chatId: chat._id }, 'chat created');
      }
      // Update chatId with the real chat ID for the new message
      chatId = chat._id;
    } else {
      chat = await Chat.findById(chatId);
    }

    if (chat) {
      logger.debug(
        { event: 'chat.message.append', chatId: chat._id, unreadCount: chat.unreadCount },
        'appending a message'
      );
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
      logger.error({ event: 'chat.message.missing' }, 'chat was null after id resolution');
      res.status(404).json({ message: 'Chat not found after processing ID.' });
    }
  } catch (error) {
    logger.error({ err: error, event: 'chat.message.failed' }, 'failed to send a chat message');
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};
