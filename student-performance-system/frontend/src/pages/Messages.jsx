import React from 'react';
import Header from '../components/Header';
import { MessageSquare, Hourglass, Shield, AlertTriangle } from 'lucide-react';

const Messages = () => {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Header title="Direct Messages" subtitle="Real-time messaging & communications hub" />
      
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex items-center justify-center min-h-[70vh]">
        <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-10 max-w-lg text-center relative overflow-hidden">
          {/* Decorative glowing gradient blur */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500 opacity-10 blur-[50px] rounded-full pointer-events-none"></div>
          
          <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
            <MessageSquare size={36} />
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
            Direct Messaging
          </h2>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <Hourglass size={12} className="animate-spin" /> Under Development
          </div>
          
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Our real-time direct messaging system is currently undergoing architectural upgrades. We are migrating to a scalable WebSocket hub (Socket.io) to support instant message routing and multi-user chat rooms in our next release (v2.1).
          </p>
          
          <div className="border-t border-slate-100 pt-6 flex flex-col gap-3 text-left">
            <div className="flex items-start gap-3">
              <Shield size={16} className="text-brand-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-700">Encrypted Communication</h4>
                <p className="text-[11px] text-slate-400">All direct chats will use end-to-end encryption protocols.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-700">Database Synchronization</h4>
                <p className="text-[11px] text-slate-400">Ensuring zero-data-loss history persistence across nodes.</p>
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 mt-8 italic">
            Thank you for your patience while we build a more secure messaging hub.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Messages;
