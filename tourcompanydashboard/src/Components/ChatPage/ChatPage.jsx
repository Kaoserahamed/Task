import React, { useState, useEffect } from 'react';
import ChatList from './Chat/ChatList';
import ChatWindow from './Chat/ChatWindow';
import { useAuth } from '../../Context/AuthContext';
import socket from '../../socket';
import './ChatPage.css';
import * as chatApi from '../../api/chat';
import { logDebug, logError } from '../../utils/logger';
const DEFAULT_ADMIN_ID = '65f1a2b3c4d5e6f7a8b9c0d1';
const ChatPage = () => {
  const [chatType, setChatType] = useState('comuse'); // 'companies' or 'admin'
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);

  const { company } = useAuth();

  logDebug('this is', company);
  useEffect(() => {
    if (company) {
      logDebug('Current logged in user:', company);
    }
  }, [company]);
  const companyId = company?.company?._id;
  const companyname = company?.company?.name;
  const username = company?.company?.userName;
  useEffect(() => {
    const fetchChats = async () => {
      try {
        if (!company?.token) {
          throw new Error('No token found');
        }
        const responseData = await chatApi.fetchChats(companyId, 'adcom');
        setChats(responseData || []);
      } catch (error) {
        logError('Error fetching chats:', error);
        setChats([]);
      }
    };
    if (companyId) {
      fetchChats();
    }
  }, [companyId]);
  // Admin chat data
  let adminChat;
  if (chats.length > 0) {
    adminChat = chats[0];
  } else {
    adminChat = {
      _id: null,
      messages: [],
      companyId: companyId,
      adminId: DEFAULT_ADMIN_ID,
      companyName: companyname,
      chatType: 'adcom',
      name: 'Admin Support',
      avatar: '/admin-avatar.png',
      online: true,
    };
  }

  return (
    <div className="chat-page">
      <div className="chat-type-selector">
        <button
          className={`type-btn ${chatType === 'comuse' ? 'active' : ''}`}
          onClick={() => {
            setChatType('comuse');
            setSelectedChat(null);
          }}
        >
          Users
        </button>
        <button
          className={`type-btn ${chatType === 'adcom' ? 'active' : ''}`}
          onClick={() => {
            setChatType('adcom');
            setSelectedChat(adminChat);
          }}
        >
          Admin Support
        </button>
      </div>

      <div className="chat-container">
        {chatType === 'comuse' ? (
          <>
            <div className={selectedChat ? 'chat-list-sidebar' : 'chat-list-full'}>
              <ChatList
                chatType={chatType}
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
                companyId={companyId}
                username={username}
                companyname={companyname}
                token={company.token}
                socket={socket}
              />
            </div>
            {selectedChat && (
              <ChatWindow
                chatType={chatType}
                selectedChat={selectedChat}
                companyname={companyname}
                username={username}
                companyId={companyId}
              />
            )}
          </>
        ) : (
          <div className="admin-chat-container">
            <ChatWindow
              chatType={chatType}
              selectedChat={adminChat}
              companyId={companyId}
              socket={socket}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
