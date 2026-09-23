const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chat');

// NOTE: the chat endpoints are still unauthenticated. Wiring the auth
// middleware in here changes runtime behaviour and is tracked as part of the
// security hardening work, not as a lint fix.

router.get('/get-chat/:companyId', ChatController.getChat);
router.get('/get-all-admin-chats', ChatController.getAdminchat);
router.get('/get-user-chat/:userId', ChatController.getuserChat);
router.post('/send-message', ChatController.usersendMessage);
router.get('/messages/:id', ChatController.fetchChat);
module.exports = router;
