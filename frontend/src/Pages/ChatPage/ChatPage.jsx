import React, { useState, useEffect } from 'react';
import ChatList from '../../Components/Chat/ChatList';
import ChatWindow from '../../Components/Chat/ChatWindow';
import { useAuth } from '../../Context/AuthContext';
import socket from '../../socket';
import { useLocation } from 'react-router-dom';
import './ChatPage.css';

const DEFAULT_ADMIN_ID = '65f1a2b3c4d5e6f7a8b9c0d1'; 

const ChatPage = () => {
  const location = useLocation();
  const [chatType, setChatType] = useState(location.state?.chatType || 'comuse');
  const [selectedChat, setSelectedChat] = useState(location.state?.Chat || null);
  const [chats, setChats] = useState([]);
  const { user } = useAuth();

  console.log(selectedChat);
  const directChat = location.state?.directChat || false;

  useEffect(() => {
    if (user) {
      console.log("Current logged in user:", user);
    }
  }, [user]);

  const userId = user?.user?._id;
  const username = user?.user?.name;

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const authtoken = localStorage.getItem('token');
        if (!authtoken) {
          throw new Error('No token found');
        }
        
        const response = await fetch(`https://backend-eight-tan-16.vercel.app/api/chat/get-user-chat/${userId}?query=${chatType}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authtoken}`
          },
        });
        const responseData = await response.json();
        if (!response.ok) {
          throw new Error('Failed to fetch chats');
        }
        setChats(responseData || []);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setChats([]);
      }
    }

    if (userId) {
      fetchChats();
    }
  }, [userId, chatType]);

  // Admin chat data
  let adminChat;
  if (chats.length > 0) {
    adminChat = chats[0];
  } else {
    adminChat = {
      _id: null,
      messages: [],
      userId: userId,
      userName: username,
      adminId: DEFAULT_ADMIN_ID, 
      chatType: 'aduse',
      name: 'Admin Support',
      avatar: '/admin-avatar.png',
      online: true
    };
  }

  return (
    <div className="chat-page">
      <div className="chat-type-selector">
        <button 
          className={`type-btn ${chatType === 'comuse' ? 'active' : ''}`}
          onClick={() => {
            setChatType('comuse');
            setSelectedChat(null); // Clear selection when switching to companies
          }}
        >
          Tour Companies
        </button>
        <button 
          className={`type-btn ${chatType === 'aduse' ? 'active' : ''}`}
          onClick={() => {
            setChatType('aduse');
            setSelectedChat(adminChat); // Auto-select admin chat
          }}
        >
          Admin Support
        </button>
      </div>

      <div className="chat-container">
        {chatType === 'comuse' ? (
          <>
            <div className={selectedChat || directChat ? 'chat-list-sidebar' : 'chat-list-full'}>
              <ChatList 
                chatType={chatType}
                selectedChat={selectedChat || location.state?.selectedChat}
                setSelectedChat={setSelectedChat}
                userId={userId}
                username={username}
                socket={socket}
              />
            </div>
            { (selectedChat&&
              <ChatWindow 
                chatType={chatType}
                selectedChat={selectedChat || location.state?.selectedChat}
                userId={userId}
                socket={socket}
              />
            )}
          </>
        ) : (
          <div className="admin-chat-container">
            <ChatWindow 
              chatType={chatType}
              selectedChat={adminChat}
              userId={userId}
              socket={socket}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
