/** Support chat endpoints (`aduse` = user chats, `adcom` = company chats). */
import { api } from './client';

export const fetchAdminChats = (chatType) =>
  api.get(`/api/chat/get-all-admin-chats?query=${chatType}`);

export const sendMessage = (message) => api.post('/api/chat/send-message', message);
