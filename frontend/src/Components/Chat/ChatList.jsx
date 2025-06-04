import React from 'react';
import './ChatList.css';
import avatar from '../Assets/chat_avatar.png';
import {useAuth} from '../../Context/AuthContext';
import {useState,useEffect} from 'react';

const ChatList = ({ chatType, selectedChat, setSelectedChat, userId, username }) => {
  const {user}=useAuth();
  const [chats,setChats]=useState([]);
  const [isloading,setIsloading]=useState(false);
  const [filter,setFilter]=useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
let response,responseData;
  useEffect(()=>{
    const fetchChats=async()=>{
      setIsloading(true);
      try {
        const authtoken=localStorage.getItem('token');
        console.log(authtoken);
        if(!authtoken){
          throw new Error('No token found');
        }
        console.log(userId);
         response=await fetch(`http://localhost:4000/api/chat/get-user-chat/${userId}?query=${chatType}`,{
          
        })
        responseData=await response.json();
        console.log(responseData);
        if(!response.ok){
          throw new Error('Failed to fetch chats');
        }
        setChats(responseData || []);
      }
      catch(error){
        console.error('Error fetching chats:',error);
        setChats([]);
      }
      finally{
        setIsloading(false);
      }
    }
    if (userId) {
      fetchChats();
    }
  },[userId]);

  const searchCompanies = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const authtoken = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/company/auth/search?query=${encodeURIComponent(query)}`, {
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
    const selectedData = chats.find(chat=>chat.companyId===company._id);
    let tempchat;
    if(!selectedData){
      
    // Create a temporary chat object without saving to database
    tempchat = {
      _id: `temp_${company._id}`, // Temporary ID
      companyName: company.name,
      userName:username,
      logo: company.logo || avatar,
      messages: [],
      lastMessage: '',
      lastMessageTime: new Date(),
      chatType:'comuse',
      unreadCount: 0,
      online: false,
      companyId: company._id,
      isTemporary: true // Flag to identify this is a temporary chat
    };
    console.log(tempchat);
  }
  else{
     tempchat=selectedData;
  }

    setSelectedChat(tempchat);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="chat-list">
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
                <h3>{chat.companyId.name}</h3>
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