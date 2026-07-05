import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, X, Send, Bot, User } from 'lucide-react';
import GlassCard from './GlassCard';
import { useAuth, api } from '../context/AuthContext';

const AICopilot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${user?.name?.split(' ')[0] || ''}! I am your PredictEdu Academic Copilot. Ask me about prediction parameters, academic recommendations, or model statistics!`
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';

  const predefinedPrompts = isAdmin 
    ? [
        { label: "Create a new project", value: "Create a new project named Alpha" },
        { label: "Search for a student", value: "Search student John" },
        { label: "How does the AI model predict?", value: "explain_model" }
      ]
    : isFaculty
    ? [
        { label: "Search for a student", value: "Search student John" },
        { label: "How does the AI model predict?", value: "explain_model" },
        { label: "Attendance improvement strategy", value: "attendance_strategy" }
      ]
    : [
        { label: "How does the AI model predict?", value: "explain_model" },
        { label: "Attendance improvement strategy", value: "attendance_strategy" },
        { label: "How to resolve low marks warnings?", value: "marks_warning" }
      ];

  const handleSend = async (text) => {
    if (!text.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInput('');
    setTyping(true);

    const query = text.toLowerCase();

    // Check if it's a student search query
    const isSearchQuery = query.includes('student') || query.includes('search') || query.includes('find') || query.includes('who is');

    if (isSearchQuery) {
      if (isStudent) {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Due to privacy and security policies, students cannot search the general database. You can only view your own performance metrics.' }]);
        setTyping(false);
        return;
      }
      
      try {
        // Extract the target search key
        let searchKey = '';
        if (query.includes('starting name with')) {
          searchKey = query.split('starting name with')[1].trim();
        } else if (query.includes('starting with')) {
          searchKey = query.split('starting with')[1].trim();
        } else if (query.includes('name with')) {
          searchKey = query.split('name with')[1].trim();
        } else if (query.includes('search')) {
          searchKey = query.split('search')[1].trim();
        } else if (query.includes('find')) {
          searchKey = query.split('find')[1].trim();
        } else {
          const words = query.split(' ');
          searchKey = words[words.length - 1];
        }

        searchKey = searchKey.replace(/[?.!]/g, '').trim();

        if (searchKey.length === 0) {
          searchKey = 'a';
        }

        // Query the students API
        const res = await api.get('/students', { params: { search: searchKey, limit: 5 } });
        const students = res.data.data || [];

        let reply = '';
        if (students.length > 0) {
          reply = `I searched the database and found ${students.length} matching students:\n\n` + 
            students.map((s, idx) => 
              `${idx + 1}. **${s.name}** (${s.rollNumber})\n` +
              `   • Dept: ${s.department.split(' (')[0]}\n` + 
              `   • Sem: ${s.semester} | Attendance: ${s.attendancePercentage}%\n` + 
              `   • Internal Marks: ${s.internalMarks}/100 | CGPA: ${s.previousCGPA}\n` +
              `   • AI Prediction: **${s.prediction?.result?.toUpperCase()}** (${s.prediction?.confidence || 0}% confidence)`
            ).join('\n\n');
        } else {
          reply = `I searched for "${searchKey}" but could not find any matching student records. Try another name or roll number.`;
        }

        setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
      } catch (err) {
        console.error('Copilot search error:', err);
        setMessages(prev => [...prev, { sender: 'bot', text: "I encountered an error querying student profiles. Please check if your authentication token is valid." }]);
      } finally {
        setTyping(false);
      }
      return;
    }

    // Check if it's a project/team creation query
    const isCreationQuery = (query.includes('project') || query.includes('team') || query.includes('task')) && 
                            (query.includes('create') || query.includes('make') || query.includes('plan') || query.includes('add'));

    if (isCreationQuery) {
      if (!isAdmin) {
        setMessages(prev => [...prev, { sender: 'bot', text: 'I am sorry, but only Administrators are authorized to create or manage workspace entities like Projects, Teams, and Tasks.' }]);
        setTyping(false);
        return;
      }
      
      try {
        let title = "New AI Project";
        if (query.includes('named')) {
          title = query.split('named')[1].trim();
        } else if (query.includes('called')) {
          title = query.split('called')[1].trim();
        }
        
        // Remove punctuation
        title = title.replace(/[?.!]/g, '');

        const projectData = {
          title: title.charAt(0).toUpperCase() + title.slice(1),
          owner: 'AI Copilot',
          status: 'Planned',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        
        await api.post('/workspace/projects', projectData);
        setMessages(prev => [...prev, { sender: 'bot', text: `I have successfully created the project "${projectData.title}" for you. It's due in 7 days.` }]);
      } catch (err) {
        setMessages(prev => [...prev, { sender: 'bot', text: `Failed to create project. Error: ${err.response?.data?.error || err.message}` }]);
      } finally {
        setTyping(false);
      }
      return;
    }

    // Call the actual backend chat API
    try {
      // Pass conversation history (excluding the user message we just added)
      const chatHistory = messages.map(m => ({ sender: m.sender, text: m.text }));
      
      const res = await api.post('/ai/chat', { 
        message: text,
        history: chatHistory
      });
      
      if (res.data.success) {
        setMessages(prev => [...prev, { sender: 'bot', text: res.data.text }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I couldn't reach the AI service right now." }]);
      }
    } catch (err) {
      console.error('AICopilot API error:', err);
      // Fallback answers in case of offline/timeout
      let reply = "I'm processing your query regarding performance metrics. Please consult the API documentation or edit student details to re-run predictions.";

      if (query.includes("explain_model") || query.includes("how does") || query.includes("random forest")) {
        reply = "The ML classifier is a Random Forest model trained on 1,000 student academic profiles. It processes 5 key variables: Attendance, Assignment Marks, Internal Marks, Previous CGPA, and Study Hours. It assigns decision tree votes to calculate Pass/Fail labels and the probability score.";
      } else if (query.includes("attendance") || query.includes("strategy")) {
        reply = "If a student's attendance falls below 75%, their Fail probability increases dramatically. Our AI suggests regular attendance, scheduling remedial catch-up sessions, and setting automated email reminders when attendance drops below the 75% critical threshold.";
      } else if (query.includes("marks") || query.includes("low") || query.includes("fail")) {
        reply = "Low internal marks (<40/100) are major risk indicators. We recommend focusing on assignment completeness, attending specialized tutoring, and increasing daily self-study hours by at least 1.5 to 2 hours to improve passing odds.";
      } else if (query.includes("hello") || query.includes("hi")) {
        reply = "Hello! How can I assist you with your academic analytics today?";
      }
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Brain/Sparkle Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-xl shadow-brand-500/35 transition-all duration-300 hover:scale-110 active:scale-95 relative"
          aria-label="Open AI Copilot"
        >
          <Sparkles size={24} />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-bold items-center justify-center text-white">AI</span>
          </span>
        </button>
      )}

      {/* Slide-out Glass Chat Panel */}
      {isOpen && (
        <GlassCard className="w-[380px] h-[500px] flex flex-col justify-between border border-white/35 shadow-2xl p-0 overflow-hidden rounded-3xl animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white border-b border-brand-400/25">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-white/20 rounded-xl">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="font-bold text-sm">PredictEdu Copilot</h4>
                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/20 text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start space-x-2.5 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  msg.sender === 'bot' 
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {msg.sender === 'bot' ? <Bot size={14} /> : <User size={14} />}
                </div>
                
                <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[75%] ${
                  msg.sender === 'bot'
                    ? 'bg-slate-100 text-slate-800 border border-slate-200/60 shadow-sm'
                    : 'bg-brand-600 text-white shadow-md shadow-brand-600/10'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-start space-x-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Bot size={14} />
                </div>
                <div className="p-3 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex space-x-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Predefined prompt pills */}
          {messages.length === 1 && (
            <div className="px-6 py-2 flex flex-col space-y-1.5 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-800/20">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Suggested Topics</span>
              <div className="flex flex-wrap gap-1.5">
                {predefinedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.value)}
                    className="text-[10px] font-semibold bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 px-2.5 py-1.5 rounded-full text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white transition duration-200"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex items-center space-x-2 p-4 border-t border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-850"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="glass-input flex-1 px-4 py-2.5 rounded-xl text-xs focus:ring-1"
              placeholder="Ask Copilot something..."
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20"
            >
              <Send size={14} />
            </button>
          </form>

        </GlassCard>
      )}

    </div>
  );
};

export default AICopilot;
