import React, { useState,useEffect } from 'react';
import ChatList from './Chat/ChatList';
import ChatWindow from './Chat/ChatWindow';
import {useAuth} from  '../../Context/AuthContext'
import socket from '../../socket';
import './ChatPage.css';
const DEFAULT_ADMIN_ID = '65f1a2b3c4d5e6f7a8b9c0d1'; 
const ChatPage = () => {
  const [chatType, setChatType] = useState('comuse'); // 'companies' or 'admin'
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats,setChats]=useState([]);
 
  const {company} = useAuth();
  
  console.log("this is",company); 
  useEffect(() => {
    if (company) {
      console.log("Current logged in user:", company);
    }
  }, [company]);
  const companyId = company?.company?._id;
  const companyname = company?.company?.name;
  const username = company?.company?.userName;
  console.log(companyId," + ",companyname);
  console.log('token is ',company.token);
  let response,responseData;
  useEffect(()=>{
    const fetchChats=async()=>{

      try {
        console.log("useEffect triggered. Token:", company.token, "Company ID:", companyId);
        const authtoken=localStorage.getItem('company-token');
        console.log("token",authtoken);
        if(!authtoken){
          throw new Error('No token found');
        }
        console.log(authtoken)
         response=await fetch(`https://backend-eight-tan-16.vercel.app/api/chat/get-chat/${companyId}?query=${'adcom'}`
, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authtoken}`
          },
      
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
                         
    }
    if (companyId) {
      fetchChats();
    }
  },[companyId]);
console.log("finally ok:  "+chats);
  // Admin chat data
  let adminChat;
  if(chats.length>0)
  {
    
    adminChat=chats[0];
   console.log(adminChat);
  }
else
   {adminChat = {
    _id: null,
    messages:[],
    companyId:companyId,
    adminId:DEFAULT_ADMIN_ID,
    companyName:companyname,
    chatType:'adcom',
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
