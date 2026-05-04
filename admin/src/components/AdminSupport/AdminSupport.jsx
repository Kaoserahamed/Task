import React, { useState, useEffect, useRef } from 'react';
import './AdminSupport.css';
import avatar from '../Assets/chat_avatar.png'; // Use a default avatar if needed
import { useAuth } from '../../context/AuthContext';
import socket from '../../socket'

const DEFAULT_ADMIN_ID = '65f1a2b3c4d5e6f7a8b9c0d1'; // Valid 24-character hex string

const AdminSupport = () => {
  const { user } = useAuth();
  const [userChats, setUserChats] = useState([]);
  const [companyChats, setCompanyChats] = useState([]);
  const [filter, setFilter] = useState('users'); // 'users' or 'companies'
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null); // Ref for the scrollable container
  const chatMainRef = useRef(null); // Ref for the main chat container
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatHeaderRef = useRef(null);
  const messageInputRef = useRef(null);

  const fetchUserChats = async () => {
    try {
      const response = await fetch(`https://backend-eight-tan-16.vercel.app/api/chat/get-all-admin-chats?query=aduse`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error('Failed to fetch user chats');
      }
      console.log('User chats:', data);
      setUserChats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      setUserChats([]);
    }
  };

  const fetchCompanyChats = async () => {
    try {
      const response = await fetch(`https://backend-eight-tan-16.vercel.app/api/chat/get-all-admin-chats?query=adcom`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error('Failed to fetch company chats');
      }
      console.log('Company chats:', data);
      setCompanyChats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching company chats:', error);
      setCompanyChats([]);
    }
  };

  // Initial fetch of chats
  useEffect(() => {
    fetchUserChats();
    fetchCompanyChats();
  }, []);

  // Socket event handling
  useEffect(() => {
    if (socket) {
      socket.on('posts', (data) => {
        console.log('Received socket event:', data);
        if (data.action === 'create' && data.updatedChat) {
          // Update the active chat if it matches
          if (activeChat && activeChat._id === data.updatedChat._id) {
            setActiveChat(data.updatedChat);
          }
          
          // Refresh the appropriate chat list
          if (data.updatedChat.chatType === 'aduse') {
            fetchUserChats();
          } else if (data.updatedChat.chatType === 'adcom') {
            fetchCompanyChats();
          }
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('posts');
      }
    };
  }, [socket, activeChat]);

  // Function to scroll to the bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages?.length]);

  // Measure header, input, and chat main heights and set messages container height
  useEffect(() => {
    const mainHeight = chatMainRef.current?.offsetHeight || 0;
    const headerHeight = chatHeaderRef.current?.offsetHeight || 0;
    const inputHeight = messageInputRef.current?.offsetHeight || 0;
    const messagesContainer = messagesContainerRef.current;

    if (messagesContainer && mainHeight > 0) {
      const messagesHeight = mainHeight - headerHeight - inputHeight;
      messagesContainer.style.height = `${messagesHeight}px`;
      messagesContainer.style.overflowY = 'auto'; // Ensure scrolling is enabled

      // Re-check scroll button visibility after layout change
      const isAtBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 100;
      setShowScrollButton(!isAtBottom);
    }

  }, [activeChat, userChats, companyChats, messagesContainerRef.current, chatMainRef.current, chatHeaderRef.current, messageInputRef.current]); // Depend on refs to re-measure on resize/layout change

  // Show/hide scroll button based on scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Show button if scrolled up more than 100px from bottom
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      setShowScrollButton(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [messagesContainerRef.current]); // Re-attach listener if container changes


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const authtoken = localStorage.getItem('token');
      const response = await fetch('https://backend-eight-tan-16.vercel.app/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authtoken}`
        },
        body: JSON.stringify({
          chatId: activeChat._id,
          content: newMessage,
          userId: activeChat.userId || null,
          adminId: DEFAULT_ADMIN_ID,
          companyId: activeChat.companyId || null,
          companyName: activeChat.companyName || null,
          userName: activeChat.userName || null,
          chatType: filter === 'users' ? 'aduse' : 'adcom',
          senderId: DEFAULT_ADMIN_ID
        })
      });

      if (response.ok) {
        setNewMessage('');
        // Socket event will handle the state update and auto-scrolling
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="admin-support">
      <div className="support-container">
        {/* Sidebar */}
        <div className="chats-sidebar">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search conversations..."
              disabled
            />
          </div>

          <div className="filter-tabs">
            <button 
              className={`filter-btn ${filter === 'users' ? 'active' : ''}`}
              onClick={() => {
                setFilter('users');
                setActiveChat(null);
              }}
            >
              Users
            </button>
            <button 
              className={`filter-btn ${filter === 'companies' ? 'active' : ''}`}
              onClick={() => {
                setFilter('companies');
                setActiveChat(null);
              }}
            >
              Companies
            </button>
          </div>

          <div className="chat-list">
            {(filter === 'users' ? userChats : companyChats).map(chat => (
              <div 
                key={chat._id}
                className={`chat-item ${activeChat?._id === chat._id ? 'active' : ''}`}
                onClick={() => setActiveChat(chat)}
              >
                <img src={chat.logo || avatar} alt={chat.userName || chat.companyName} className="chat-avatar" />
                <div className="chat-content">
                  <div className="chat-header">
                    <h4>{chat.userName || chat.companyName}</h4>
                    <span className="chat-time">{chat.lastMessageTime && new Date(chat.lastMessageTime).toLocaleTimeString()}</span>
                  </div>
                  <p className="chat-preview">{chat.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-main" ref={chatMainRef}> {/* Attach ref here */}
          {activeChat ? (
            <>
              <div className="chat-header" ref={chatHeaderRef}> {/* Ref to measure header height */}
                <div className="chat-user-info">
                  <img src={activeChat.logo || avatar} alt={activeChat.userName || activeChat.companyName} className="chat-avatar" />
                  <div>
                    <h3>{activeChat.userName || activeChat.companyName}</h3>
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="action-btn">
                    <i className="fas fa-phone"></i>
                  </button>
                  <button className="action-btn">
                    <i className="fas fa-video"></i>
                  </button>
                  <button className="action-btn">
                    <i className="fas fa-info-circle"></i>
                  </button>
                </div>
              </div>

              {/* Chat Messages - Height set dynamically */}
              <div 
                className="chat-messages" 
                ref={messagesContainerRef} 
                // Style will be set dynamically in useEffect
              > 
                {(activeChat.messages || []).map(message => (
                  <div 
                    key={message._id} 
                    className={`message ${message.senderId === DEFAULT_ADMIN_ID ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{message.content}</p>
                      <span className="message-time">{message.sentAt ? new Date(message.sentAt).toLocaleTimeString() : ''}</span>
                    </div>
                  </div>
                ))}
                {/* Scroll reference at the end of messages */}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to Bottom Button - Positioned relative to .chat-main */}
              {showScrollButton && activeChat?.messages?.length > 0 && (
                <button 
                  className="scroll-to-bottom-btn"
                  onClick={scrollToBottom}
                >
                  <i className="fas fa-arrow-down"></i>
                </button>
              )}

              <form className="message-input" onSubmit={handleSendMessage} ref={messageInputRef}> {/* Ref to measure input height */}
                {/* <button type="button" className="attachment-btn">
                  <i className="fas fa-paperclip"></i>
                </button> */}
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="send-btn">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
