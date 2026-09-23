import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import API_BASE_URL from '../config/api';

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
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${API_BASE_URL}/api/chat/get-user-chat/${user.user._id}?query=${chatType}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch chats');
        const data = await response.json();
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/chat/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
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
