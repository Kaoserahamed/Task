import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as chatApi from '../api/chat';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchChats = useCallback(
    async (chatType = 'comuse') => {
      if (!user?.user?._id) return;

      try {
        setLoading(true);
        const data = await chatApi.fetchUserChats(user.user._id, chatType);
        setChats(data || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching chats:', err);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const sendMessage = useCallback(async (messageData) => {
    try {
      return await chatApi.sendMessage(messageData);
    } catch (err) {
      setError(err.message);
      console.error('Error sending message:', err);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    chats,
    selectedChat,
    loading,
    error,
    setSelectedChat,
    fetchChats,
    sendMessage,
    clearError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
