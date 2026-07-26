import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import config from '../config';
import ADMIN_COLORS from '../theme/colors';
import {
  MessageSquare,
  Send,
  User,
  Search,
  CheckCheck,
  Headphones,
  Clock,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

const API_URL = config.API_URL;
const SOCKET_URL = config.SOCKET_URL;

export default function SupportChat() {
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const activeUserRef = useRef(activeUser);

  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  // Debounce search term to prevent excessive filter re-computations
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchConversations();

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.emit('admin:join');

    newSocket.on('chat:new_message', (msg) => {
      const currentActive = activeUserRef.current;
      setMessages((prev) => {
        if (msg.userId === currentActive?.userId) {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        }
        return prev;
      });
      fetchConversations();
    });

    newSocket.on('chat:admin_notification', (msg) => {
      fetchConversations();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API_URL}/chat/conversations`);
      if (res.data.success) {
        const convs = res.data.conversations || [];
        setConversations(convs);
        if (!activeUserRef.current && convs.length > 0) {
          selectConversation(convs[0]);
        }
      }
    } catch (e) {
      console.error('Fetch conversations error:', e);
    }
  };

  const selectConversation = async (conv) => {
    setActiveUser(conv);
    if (socket && conv.userId) {
      socket.emit('chat:join', { userId: conv.userId });
      socket.emit('chat:mark_read', { userId: conv.userId, role: 'admin' });
    }
    try {
      const res = await axios.get(`${API_URL}/chat/messages/${conv.userId}`);
      if (res.data.success) {
        setMessages(res.data.messages || []);
      }
      if (conv.unreadCount > 0) {
        await axios.put(`${API_URL}/chat/mark-read`, { userId: conv.userId, role: 'admin' });
        // Update local state without fetching conversations again
        setConversations(prev => prev.map(c => c.userId === conv.userId ? { ...c, unreadCount: 0 } : c));
      }
    } catch (e) {
      console.error('Fetch messages error:', e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUser?.userId) return;

    const messageText = inputText.trim();
    setInputText('');

    const payload = {
      userId: activeUser.userId,
      text: messageText,
      senderRole: 'admin'
    };

    if (socket) {
      socket.emit('chat:send_message', payload);
    } else {
      try {
        await axios.post(`${API_URL}/chat/send`, payload);
        selectConversation(activeUser);
      } catch (err) {
        console.error('Send message error:', err);
      }
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const name = c.user?.name || 'Customer';
    const mobile = c.user?.mobile || '';
    return (
      name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      mobile.includes(debouncedSearch)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: ADMIN_COLORS.textPrimary }}>
            <Headphones size={26} style={{ color: ADMIN_COLORS.primary }} />
            Live Customer Support Desk
          </h2>
          <p className="text-sm font-medium mt-1" style={{ color: ADMIN_COLORS.textSecondary }}>
            Real-time multi-channel support chat with active customers
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Left Side: Conversations List */}
        <div 
          className="lg:col-span-4 rounded-3xl border flex flex-col overflow-hidden shadow-2xl"
          style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
        >
          {/* Search Box with Debounce */}
          <div className="p-4 border-b" style={{ borderColor: ADMIN_COLORS.border }}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: ADMIN_COLORS.textMuted }} />
              <input
                type="text"
                placeholder="Search user name or phone..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border text-xs font-medium outline-none"
                style={{ backgroundColor: '#1A1A1A', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="py-12 text-center text-xs font-semibold" style={{ color: ADMIN_COLORS.textMuted }}>
                No active conversations found.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeUser?.userId === conv.userId;
                return (
                  <div
                    key={conv.userId}
                    onClick={() => selectConversation(conv)}
                    className="p-3.5 rounded-2xl border cursor-pointer transition-all duration-200"
                    style={{
                      backgroundColor: isSelected ? '#1F1A17' : '#181818',
                      borderColor: isSelected ? ADMIN_COLORS.primary : ADMIN_COLORS.border,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs"
                          style={{ backgroundColor: ADMIN_COLORS.primary, color: '#432B1E' }}
                        >
                          {conv.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-white">
                            {conv.user?.name || 'Customer'}
                          </h4>
                          <p className="text-[11px] font-medium" style={{ color: ADMIN_COLORS.textSecondary }}>
                            {conv.user?.mobile || 'No Mobile'}
                          </p>
                        </div>
                      </div>

                      {conv.unreadCount > 0 && (
                        <span 
                          className="px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse"
                          style={{ backgroundColor: ADMIN_COLORS.primary, color: '#432B1E' }}
                        >
                          {conv.unreadCount} NEW
                        </span>
                      )}
                    </div>

                    <p className="text-xs truncate mt-2 font-medium" style={{ color: ADMIN_COLORS.textMuted }}>
                      {conv.lastMessage?.text || 'No messages yet'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat Box */}
        <div 
          className="lg:col-span-8 rounded-3xl border flex flex-col overflow-hidden shadow-2xl"
          style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
        >
          {activeUser ? (
            <>
              {/* Chat Room Header */}
              <div 
                className="p-4 border-b flex items-center justify-between"
                style={{ borderColor: ADMIN_COLORS.border, backgroundColor: '#181818' }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md"
                    style={{ backgroundColor: ADMIN_COLORS.primary, color: '#432B1E' }}
                  >
                    {activeUser.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">
                      {activeUser.user?.name || 'Customer'}
                    </h3>
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: ADMIN_COLORS.textSecondary }}>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Live Support Session • {activeUser.user?.mobile}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Messages Feed with Admin on Right and Customer on Left */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar" style={{ backgroundColor: '#111111' }}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs" style={{ color: ADMIN_COLORS.textMuted }}>
                    <MessageSquare size={32} className="mb-2 opacity-50" />
                    <span>No chat history yet. Send a message to start the support session.</span>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isAdmin = msg.senderRole === 'admin';
                    return (
                      <div
                        key={msg._id || index}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className="max-w-[70%] px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-lg"
                          style={{
                            backgroundColor: isAdmin ? ADMIN_COLORS.primary : '#262626',
                            color: isAdmin ? '#432B1E' : '#FFFFFF',
                            borderBottomRightRadius: isAdmin ? '4px' : '18px',
                            borderBottomLeftRadius: !isAdmin ? '4px' : '18px',
                          }}
                        >
                          <div>{msg.text}</div>
                          <div 
                            className="text-[9px] font-bold mt-1 text-right"
                            style={{ color: isAdmin ? 'rgba(67, 43, 30, 0.75)' : ADMIN_COLORS.textMuted }}
                          >
                            {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Message Input Form */}
              <form 
                onSubmit={handleSendMessage}
                className="p-4 border-t flex items-center gap-3"
                style={{ borderColor: ADMIN_COLORS.border, backgroundColor: '#181818' }}
              >
                <input
                  type="text"
                  placeholder="Type support reply..."
                  className="flex-1 px-4 py-3 rounded-2xl border text-xs font-semibold outline-none"
                  style={{ backgroundColor: '#111111', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-xl"
                  style={{ backgroundColor: ADMIN_COLORS.primary, color: '#432B1E' }}
                >
                  <span>SEND</span>
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs" style={{ color: ADMIN_COLORS.textMuted }}>
              Select a customer conversation from the left to open live support.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
