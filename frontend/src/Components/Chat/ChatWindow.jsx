import React, { useState, useEffect,useRef } from 'react';
import './ChatWindow.css';
import avatar from '../Assets/chat_avatar.png';
import { useAuth } from '../../Context/AuthContext';

const ChatWindow = ({ chatType,selectedChat, userId, socket }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null); // Ref for the scrollable container
  const chatMainRef = useRef(null); // Ref for the main chat container
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatHeaderRef = useRef(null);
  const messageInputRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
console.log(selectedChat);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages?.length]);

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

  // Add socket event listener for new messages
  useEffect(() => {
    if (socket) {
      socket.on('posts', (data) => {
        if (data.action === 'create' && data.updatedChat) {
          // Check if the updated chat is for the current chat window
          if (chatType === 'aduse' && data.updatedChat.chatType === 'aduse' && 
            data.updatedChat.participants === userId) {
      console.log('Updating admin-company chat messages:', data.updatedChat.messages);
      setMessages(data.updatedChat.messages || []);
    }
        }
      });
    }

    // Cleanup socket listener on component unmount
    return () => {
      if (socket) {
        socket.off('posts');
      }
    };
  }, [socket, selectedChat?._id]);

  // Update messages when selectedChat changes
  useEffect(() => {
    if (selectedChat?.messages) {
      setMessages(selectedChat.messages);
    }
  }, [selectedChat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const authtoken = localStorage.getItem('token');
      if (!authtoken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://backend-eight-tan-16.vercel.app/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authtoken}`
        },
        body: JSON.stringify({
          chatId: selectedChat._id,
          content: newMessage,
          userId: userId,
          chatType: selectedChat.chatType,
          companyId: selectedChat.companyId || null,
          companyName: selectedChat.companyName || null,
          userName: selectedChat.userName,
          senderId: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const updatedChat = await response.json();
      setMessages(updatedChat.messages || []);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error.message);
      alert('Failed to send message: ' + error.message);
    }
  };

  return (
    <div className="chat-window" ref={chatMainRef}>
      <div className="chat-header" ref={chatHeaderRef}>
        <div className="chat-recipient">
          <img src={selectedChat?.logo || avatar} alt={selectedChat?.name} />
          <div>
            <h3>{selectedChat?.companyName || selectedChat?.name}</h3>
            <span className={`status ${selectedChat?.online ? 'online' : 'offline'}`}>
              {selectedChat?.online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="messages-container"ref={messagesContainerRef}  >
        {isLoading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <div 
              key={message._id || message.timestamp}
              className={`message ${message.senderId === userId ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                {message.content}
              </div>
              <span className="message-time">
                {new Date(message.timestamp || message.sentAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        ) : (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {showScrollButton && messages?.length > 0 && (
                <button 
                  className="scroll-to-bottom-btn"
                  onClick={scrollToBottom}
                >
                  <i className="fas fa-arrow-down"></i>
                </button>
       )}
      <form className="message-input" onSubmit={handleSubmit}  ref={messageInputRef}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit">
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow; 
