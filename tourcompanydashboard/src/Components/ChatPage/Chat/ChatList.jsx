import React from 'react';
import './ChatList.css';
import avatar from '../../Assets/chat_avatar.png';
import {useState,useEffect} from 'react';

const ChatList = ({ chatType, selectedChat, setSelectedChat,companyId,companyname,username,token ,socket}) => {
  
  const [chats,setChats]=useState([]);
  const [isloading,setIsloading]=useState(false);
  const [filter,setFilter]=useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  console.log(username);
let response,responseData;
const fetchChats=async()=>{
  setIsloading(true);
  try {
    console.log("useEffect triggered. Token:", token, "Company ID:", companyId);
    const authtoken=localStorage.getItem('company-token');
    console.log("token",authtoken);
    if(!token){
      throw new Error('No token found');
    }
    console.log(token)
     response=await fetch(`https://backend-eight-tan-16.vercel.app/api/chat/get-chat/${companyId}?query=${'comuse'}`
, {
      method: 'GET',
  
     
    }
     )
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
  useEffect(()=>{
    
    if (companyId) {
      fetchChats();
    }
  },[companyId]);
  useEffect(() => {
    if (socket) {
      socket.on('posts', (data) => {
        if (data.action === 'create' && data.updatedChat) {
          // Check if the updated chat is for the current chat window
          if (data.updatedChat.companyId === companyId) {
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
      const authtoken = localStorage.getItem('company-token');
      const response = await fetch(`https://backend-eight-tan-16.vercel.app/user/auth/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${authtoken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.users || []);
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

  const handlecompanySelect = async (user) => {
    const selectedData = chats.find(chat=>chat.userId===user._id);
    let tempchat;
    if(!selectedData){
     let companylogo
    // Create a temporary chat object without saving to database
    tempchat = {
      _id: null, // Temporary ID
      companyName: companyname,
      userName:user.name,
      userId:user._id,
      logo: companylogo || avatar,
      lastMessage: '',
      messages:[],
      lastMessageTime: new Date(),
      chatType:'comuse',
      unreadCount: 0,
      online: false,
      companyId: companyId,
      isTemporary: true // Flag to identify this is a temporary chat
    };
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
        <h2>{chatType === 'comuse' ? 'Users' : 'Admin Support'}</h2>
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
            searchResults.map(user => (
              <div
                key={user._id}
                className="search-result-item"
                onClick={() => handlecompanySelect(user)}
              >
                <img src={user.logo || avatar} alt={user.name} />
                <div className="company-info">
                  <h4>{user.name}</h4>
                  <p>{user.description}</p>
                </div>
              </div>
            ))
          ) : searchQuery ? (
            <div className="no-results">No user found</div>
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
                <h3>{chat.userName}</h3>
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
