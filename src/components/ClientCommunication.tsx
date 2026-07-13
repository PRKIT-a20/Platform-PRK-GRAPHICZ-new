import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, Send, Paperclip, MessageSquare, Briefcase, User, Search } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface Conversation {
  id: string;
  project_title: string;
  project_status: string;
  designer_name: string;
  last_message: string;
  last_activity: string;
}

interface Message {
  id: string;
  sender_name: string;
  content: string;
  created_at: string;
  is_sender: boolean;
}

export const ClientCommunication: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<Conversation[]>('/api/conversations');
      setConversations(res.data || []);
      if (res.data && res.data.length > 0 && !activeConversation) {
        setActiveConversation(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      setLoadingMessages(true);
      const res = await apiFetch<Message[]>(`/api/conversations/${convId}/messages`);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      await apiFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ conversation_id: activeConversation.id, content: newMessage })
      });
      setNewMessage('');
      fetchMessages(activeConversation.id);
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;

  return (
    <div className="grid md:grid-cols-[300px,1fr] gap-6 h-[600px] animate-fade-in">
      <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-black/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={16} />
            <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-black/5 rounded-xl text-sm font-semibold outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <button 
              key={conv.id} 
              onClick={() => setActiveConversation(conv)}
              className={`w-full p-4 border-b border-black/5 text-left transition-all ${activeConversation?.id === conv.id ? 'bg-brand-primary/5' : 'hover:bg-black/[0.02]'}`}
            >
              <h4 className="font-bold text-sm truncate">{conv.project_title}</h4>
              <p className="text-xs text-black/40 truncate mt-1">{conv.last_message}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm flex flex-col overflow-hidden">
        {activeConversation ? (
          <>
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{activeConversation.project_title}</h3>
                <p className="text-xs font-bold text-brand-primary uppercase tracking-widest">{activeConversation.project_status}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full text-xs font-bold text-black/60">
                <User size={14} /> {activeConversation.designer_name}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? <Loader2 className="animate-spin text-brand-primary mx-auto" /> : messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.is_sender ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${msg.is_sender ? 'bg-brand-primary text-brand-secondary' : 'bg-black/10'}`}>
                    {msg.sender_name[0]}
                  </div>
                  <div className={`p-4 rounded-2xl max-w-[70%] text-sm ${msg.is_sender ? 'bg-brand-primary text-brand-secondary' : 'bg-black/5'}`}>
                    {msg.content}
                    <p className={`text-[10px] mt-1 ${msg.is_sender ? 'text-brand-secondary/60' : 'text-black/40'}`}>{format(new Date(msg.created_at), 'HH:mm')}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-black/5 flex gap-2">
              <button type="button" className="p-3 text-black/40 hover:text-brand-primary transition-all"><Paperclip size={20} /></button>
              <input 
                type="text" 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-black/5 rounded-xl text-sm outline-none"
              />
              <button type="submit" className="p-3 bg-brand-primary text-brand-secondary rounded-xl hover:bg-opacity-90 transition-all"><Send size={20} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-black/40">Select a conversation</div>
        )}
      </div>
    </div>
  );
};
