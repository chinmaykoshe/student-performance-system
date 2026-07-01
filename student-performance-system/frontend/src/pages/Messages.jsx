import React, { useState, useEffect, useRef } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Header from '../components/Header';
import { Search, Send, User, MessageSquare, Ban, UserCheck, ShieldAlert } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [blockingAction, setBlockingAction] = useState(false);
  
  const messagesEndRef = useRef(null);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/messages/contacts');
      if (res.data.success) {
        setContacts(res.data.data);
        // Sync selected contact's block status if it changed
        if (selectedContact) {
          const updated = res.data.data.find(c => c._id === selectedContact._id);
          if (updated) setSelectedContact(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  // Fetch contacts on mount and periodically
  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 7000);
    return () => clearInterval(interval);
  }, [selectedContact]);

  // Fetch messages when a contact is selected
  useEffect(() => {
    if (!selectedContact) return;
    
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${selectedContact._id}`);
        if (res.data.success) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
    
    // Poll for new messages every 4 seconds
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [selectedContact]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    try {
      const res = await api.post('/messages', {
        receiverId: selectedContact._id,
        content: newMessage.trim()
      });
      if (res.data.success) {
        setMessages(prev => [...prev, res.data.data]);
        setNewMessage('');
        fetchContacts(); // Refresh list to update last message preview
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send message.');
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedContact) return;
    setBlockingAction(true);
    try {
      const isBlocked = selectedContact.isBlockedByMe;
      const endpoint = isBlocked ? `/messages/unblock/${selectedContact._id}` : `/messages/block/${selectedContact._id}`;
      const res = await api.post(endpoint);
      if (res.data.success) {
        await fetchContacts();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Block operation failed.');
    } finally {
      setBlockingAction(false);
    }
  };

  // Filtered contacts based on search query
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Header title="Direct Messages" subtitle="Real-time messaging & communications hub" />
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full h-[calc(100vh-100px)] flex gap-6">
        
        {/* Left Pane: Contacts List */}
        <div className="w-1/3 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Conversations</h3>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search contacts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredContacts.length === 0 ? (
              <p className="text-center text-sm text-slate-400 mt-6">No conversations found.</p>
            ) : (
              filteredContacts.map(contact => (
                <div 
                  key={contact._id} 
                  onClick={() => setSelectedContact(contact)}
                  className={`flex items-center space-x-3 p-3 rounded-2xl cursor-pointer transition-colors relative border ${
                    selectedContact?._id === contact._id 
                      ? 'bg-brand-50 border-brand-100' 
                      : 'hover:bg-slate-50 border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-brand-400 text-white flex items-center justify-center font-bold shadow-sm relative shrink-0">
                    {contact.name.charAt(0).toUpperCase()}
                    {contact.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{contact.name}</h4>
                      {contact.isBlockedByMe && (
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">Blocked</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-xs text-slate-500 truncate capitalize">{contact.role}</p>
                      {contact.lastMessageTime && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(contact.lastMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {contact.lastMessage && (
                      <p className="text-xs text-slate-400 truncate mt-1 max-w-[200px]">
                        {contact.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Chat Window */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-brand-400 text-white flex items-center justify-center font-bold">
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{selectedContact.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">{selectedContact.role}</p>
                  </div>
                </div>
                
                {/* Block / Unblock Button */}
                <button
                  onClick={handleToggleBlock}
                  disabled={blockingAction}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedContact.isBlockedByMe
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {selectedContact.isBlockedByMe ? (
                    <>
                      <UserCheck size={14} />
                      <span>Unblock User</span>
                    </>
                  ) : (
                    <>
                      <Ban size={14} />
                      <span>Block User</span>
                    </>
                  )}
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
                {loading && messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageSquare size={48} className="mb-4 opacity-50" />
                    <p>Start a conversation with {selectedContact.name}</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender === user?._id || msg.sender === user?.id;
                    return (
                      <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${isMe ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'}`}>
                          <p className="text-sm">{msg.content}</p>
                          <span className={`text-[10px] mt-1 block ${isMe ? 'text-brand-100 text-right' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input / Block Status Notification */}
              {selectedContact.isBlockedByMe ? (
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center space-x-2 text-slate-500 text-sm">
                  <ShieldAlert size={16} className="text-rose-500" />
                  <span>You have blocked this contact. Unblock to resume conversation.</span>
                </div>
              ) : selectedContact.hasBlockedMe ? (
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center space-x-2 text-slate-500 text-sm">
                  <ShieldAlert size={16} className="text-rose-500" />
                  <span>This user has blocked you. You cannot message them.</span>
                </div>
              ) : (
                <div className="p-4 bg-white border-t border-slate-100">
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-500/20 shrink-0"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <MessageSquare size={64} className="mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-slate-500">Your Messages</h3>
              <p className="text-sm">Select a contact to view or start a conversation.</p>
            </div>
          )}
        </div>
        
      </main>
    </div>
  );
};

export default Messages;
