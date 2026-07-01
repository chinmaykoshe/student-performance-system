import React, { useState, useEffect, useRef } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Header from '../components/Header';
import { Search, Send, User, MessageSquare } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Fetch contacts on mount
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get('/messages/contacts');
        if (res.data.success) {
          setContacts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load contacts:', err);
      }
    };
    fetchContacts();
  }, []);

  // Fetch messages when a contact is selected
  useEffect(() => {
    if (!selectedContact) return;
    
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/messages/${selectedContact._id}`);
        if (res.data.success) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Poll for new messages every 5 seconds (REST polling)
    const interval = setInterval(fetchMessages, 5000);
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
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Header title="Direct Messages" />
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full h-[calc(100vh-80px)] flex gap-6">
        
        {/* Left Pane: Contacts List */}
        <div className="w-1/3 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Conversations</h3>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search contacts..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {contacts.length === 0 ? (
              <p className="text-center text-sm text-slate-400 mt-6">No contacts found.</p>
            ) : (
              contacts.map(contact => (
                <div 
                  key={contact._id} 
                  onClick={() => setSelectedContact(contact)}
                  className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedContact?._id === contact._id ? 'bg-brand-50 border border-brand-100' : 'hover:bg-slate-50'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-brand-400 text-white flex items-center justify-center font-bold shadow-sm">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{contact.name}</h4>
                    <p className="text-xs text-slate-500 truncate capitalize">{contact.role}</p>
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
              <div className="flex items-center space-x-4 p-4 border-b border-slate-100 bg-white">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-brand-400 text-white flex items-center justify-center font-bold">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{selectedContact.name}</h3>
                  <p className="text-xs text-slate-500 capitalize">{selectedContact.role}</p>
                </div>
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
                    const isMe = msg.sender === user.id;
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

              {/* Message Input */}
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
                    className="p-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-500/20"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
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
