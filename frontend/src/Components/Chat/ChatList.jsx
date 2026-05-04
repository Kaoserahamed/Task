import React from 'react';
import './ChatList.css';
import avatar from '../Assets/chat_avatar.png';
import {useAuth} from '../../Context/AuthContext';
import {useState, useEffect} from 'react';

const ChatList = ({ chatType, selectedChat, setSelectedChat, userId, username, socket }) => {
  const {user} = useAuth();
  const [chats, setChats] = useState([]);
  const [isloading, setIsloading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchChats = async () => {
    setIsloading(true);
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
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const responseData = await response.json();
      setChats(responseData || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    } finally {
      setIsloading(false);
    }
  };

  // Initial fetch of chats
  useEffect(() => {
    if (userId) {
      console.log('its happening');
      console.log(userId);
      fetchChats();
    }
  }, [userId, chatType]);
   
  // Socket event handling
  useEffect(() => {
    if (socket) {
      socket.on('posts', (data) => {
        if (data.action === 'create' && data.updatedChat) {
          // Check if the updated chat is for the current chat window
          if (data.updatedChat.participants === userId) {
            console.log(data.updatedChat.participants);
            setSelectedChat(data.updatedChat);
            fetchChats();
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

  const searchCompanies = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const authtoken = localStorage.getItem('token');
      const response = await fetch(`https://backend-eight-tan-16.vercel.app/company/auth/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${authtoken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.companies || []);
      } else {
        console.error('Search failed:', data.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching companies:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchCompanies(query);
  };

  const handleCompanySelect = async (company) => {
    const selectedData = chats.find(chat => chat.companyId === company._id);
    let tempchat;
    
    if (!selectedData) {
      tempchat = {
        _id: `temp_${company._id}`,
        companyName: company.name,
        userName: username,
        logo: company.logo || avatar,
        messages: [],
        lastMessage: '',
        lastMessageTime: new Date(),
        chatType: 'comuse',
        unreadCount: 0,
        online: false,
        companyId: company._id,
        isTemporary: true
      };
    } else {
      tempchat = selectedData;
    }

    setSelectedChat(tempchat);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="chat-sidebar">
      <div className="chat-list-header">
        <h2>{chatType === 'comuse' ? 'Tour Companies' : 'Admin Support'}</h2>
        {chatType === 'comuse' && (
          <button className="new-chat-btn" onClick={() => setShowSearch(!showSearch)}>
            <i className="fas fa-plus"></i>
          </button>
        )}
      </div>

      {showSearch && (
        <div className="search-container">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button className="search-close-btn" onClick={() => {
            setShowSearch(false);
            setSearchQuery('');
            setSearchResults([]);
          }}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {showSearch && (
        <div className="search-results">
          {isSearching ? (
            <div className="loading">Searching...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map(company => (
              <div
                key={company._id}
                className="search-result-item"
                onClick={() => handleCompanySelect(company)}
              >
                <img src={company.logo || avatar} alt={company.name} />
                <div className="company-info">
                  <h4>{company.name}</h4>
                  <p>{company.description}</p>
                </div>
              </div>
            ))
          ) : searchQuery ? (
            <div className="no-results">No companies found</div>
          ) : null}
        </div>
      )}

      <div className="chats">
        {isloading ? (
          <div className="loading">Loading chats...</div>
        ) : chats.length > 0 ? (
          chats.map(chat => (
            <div 
              key={chat._id}
              className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="chat-avatar">
                <img src={chat.logo || avatar} alt={chat.name} />
                <span className={`status ${chat.online ? 'online' : 'offline'}`}></span>
              </div>
              <div className="chat-info">
                <h3>{chat.companyId?.name || chat.companyName}</h3>
                <p>{chat.lastMessage}</p>
              </div>
              {chat.unreadCount > 0 && (
                <span className="unread-count">{chat.unreadCount}</span>
              )}
            </div>
          ))
        ) : (
          <div className="no-chats">No chats found</div>
        )}
      </div>
    </div>
  );
};

export default ChatList; 
