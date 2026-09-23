/** Support chat endpoints (`comuse` = company chats, `aduse` = admin chats). */
import { api } from './client';

export const fetchUserChats = (userId, chatType) =>
  api.get(`/api/chat/get-user-chat/${userId}?query=${chatType}`);

export const fetchChatMessages = (companyId, query) =>
  api.get(`/api/chat/get-chat/${companyId}?query=${query}`);

export const sendMessage = (message) => api.post('/api/chat/send-message', message);
