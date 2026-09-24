/** Support chat endpoints (`adcom` = admin chats, `comuse` = user chats). */
import { api } from './client';

export const fetchChats = (companyId, query) =>
  api.get(`/api/chat/get-chat/${companyId}?query=${query}`);

export const sendMessage = (message) => api.post('/api/chat/send-message', message);
