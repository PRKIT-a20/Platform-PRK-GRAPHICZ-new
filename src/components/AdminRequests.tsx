import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  FileText, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  ExternalLink,
  ChevronRight,
  Filter,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface Request {
  id: string;
  user_id: number;
  title: string;
  description: string;
  status: 'pending' | 'Submitted' | 'In Design Process' | 'Review' | 'Delivered' | 'in_progress' | 'delivered';
  created_at: string;
  delivery_url?: string;
  project_nr?: string;
  review_count?: number;
  product_type?: string;
  designer_id?: number | null;
}

interface UserRecord {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: number;
  message_text: string;
  created_at: string;
}

export const AdminRequests: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit State
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editDesignerId, setEditDesignerId] = useState<string>('');
  const [editDeliveryUrl, setEditDeliveryUrl] = useState('');
  const [editReviewCount, setEditReviewCount] = useState(0);
  const [saving, setSaving] = useState(false);

  // Chat/Overleg State
  const [chattingRequest, setChattingRequest] = useState<Request | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequestsAndUsers();
  }, []);

  const fetchRequestsAndUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reqRes, usersRes] = await Promise.all([
        apiFetch<Request[]>('/api/requests'),
        apiFetch<UserRecord[]>('/api/users')
      ]);

      setRequests(reqRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Failed to load requests & users data:', err);
      setError('Could not fetch requests or designers.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Design Process': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Review': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'in_progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleOpenEdit = (req: Request) => {
    setEditingRequest(req);
    setEditStatus(req.status);
    setEditDesignerId(req.designer_id?.toString() || '');
    setEditDeliveryUrl(req.delivery_url || '');
    setEditReviewCount(req.review_count || 0);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        status: editStatus,
        designer_id: editDesignerId ? Number(editDesignerId) : null,
        delivery_url: editDeliveryUrl.trim() || null,
        review_count: Number(editReviewCount)
      };

      const res = await apiFetch<Request>(`/api/requests/${editingRequest.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.data) {
        setRequests(prev => prev.map(r => r.id === editingRequest.id ? { ...r, ...payload } : r));
        setEditingRequest(null);
      }
    } catch (err: any) {
      console.error('Failed to save request edit:', err);
      setError(err.message || 'Saving request update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChat = async (request: Request) => {
    setChattingRequest(request);
    setChatMessages([]);
    setNewMessageText('');
    
    try {
      // Find or create conversation for this request/client
      const convsRes = await apiFetch<any[]>('/api/conversations');
      const conversations = convsRes.data || [];
      
      // Look for conversation matching client user id
      let conversation = conversations.find(c => Number(c.client_id) === Number(request.user_id));
      
      let convId = '';
      if (conversation) {
        convId = conversation.id;
      } else {
        // Create new conversation
        const newConvRes = await apiFetch<any>('/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            client_id: request.user_id,
            title: `Overleg: ${request.title}`
          })
        });
        
        const newConv = Array.isArray(newConvRes.data) ? newConvRes.data[0] : newConvRes.data;
        convId = newConv?.id;
      }

      if (convId) {
        setActiveConversationId(convId);
        const msgsRes = await apiFetch<Message[]>(`/api/messages?conversation_id=${convId}`);
        setChatMessages((msgsRes.data || []).reverse()); // Oldest first
      }
    } catch (err) {
      console.error('Failed to load chat conversation:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeConversationId || !chattingRequest) return;

    try {
      setSendingMessage(true);
      const res = await apiFetch<Message>('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: activeConversationId,
          message_text: newMessageText.trim()
        })
      });

      if (res.data) {
        const addedMsg = Array.isArray(res.data) ? res.data[0] : res.data;
        setChatMessages(prev => [...prev, addedMsg]);
        setNewMessageText('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Lists
  const designers = users.filter(u => u.role === 'designer' || u.role === 'admin' || u.role === 'super_admin');
  const filteredRequests = requests.filter(req => {
    const client = users.find(u => u.id === req.user_id);
    const clientName = client?.full_name || client?.email || '';
    const matchesSearch = req.title.toLowerCase().includes(search.toLowerCase()) || 
                          clientName.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return req.status === statusFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#006663]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-black/80">Klant Aanvragen Panel</h3>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="text" 
            placeholder="Zoeken op titel of klant..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-white border border-black/5 rounded-full text-xs outline-none focus:border-black/20"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-black/5 rounded-full text-xs font-bold outline-none cursor-pointer"
          >
            <option value="all">Alle Statussen</option>
            <option value="Submitted">Ontvangen (Submitted)</option>
            <option value="In Design Process">In Design Process</option>
            <option value="Review">Review</option>
            <option value="Delivered">Klaar (Delivered)</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Requests list */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map((req) => {
          const client = users.find(u => u.id === req.user_id);
          const designer = users.find(u => u.id === req.designer_id);
          const clientName = client?.full_name || client?.email || `Klant #${req.user_id}`;
          const designerName = designer ? (designer.full_name || designer.email) : 'Niet toegewezen';

          return (
            <div 
              key={req.id}
              className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-black/80 truncate">{req.title || req.product_type}</h4>
                  <span className={`px-3 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>

                <p className="text-black/50 text-xs font-semibold leading-relaxed mb-3 line-clamp-2">{req.description}</p>
                
                <div className="flex flex-wrap gap-4 text-[10px] font-bold text-black/40">
                  <span className="bg-black/5 px-2.5 py-1 rounded-md">Klant: {clientName}</span>
                  <span className="bg-black/5 px-2.5 py-1 rounded-md">Designer: {designerName}</span>
                  <span className="bg-black/5 px-2.5 py-1 rounded-md">Revisies: {req.review_count || 0}</span>
                  <span className="bg-black/5 px-2.5 py-1 rounded-md">{format(new Date(req.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <button 
                  onClick={() => handleOpenChat(req)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-black/5 hover:bg-black/10 text-black px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
                >
                  <MessageSquare size={14} />
                  Chat Overleg
                </button>
                <button 
                  onClick={() => handleOpenEdit(req)}
                  className="p-2.5 bg-[#006663]/5 hover:bg-[#006663]/10 text-[#006663] rounded-xl transition-colors"
                  title="Beheer Aanvraag"
                >
                  <Edit size={16} />
                </button>
                {req.delivery_url && (
                  <a 
                    href={req.delivery_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors"
                    title="Download opgeleverd bestand"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-black/5 text-center text-black/40 font-semibold">
            Geen aanvragen gevonden die voldoen aan het filter.
          </div>
        )}
      </div>

      {/* Edit Request Modal */}
      {editingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingRequest(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-6">
              <h4 className="font-bold text-lg text-black/80">Aanvraag Beheren</h4>
              <button onClick={() => setEditingRequest(null)} className="text-black/40 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Project Status</label>
                <select 
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                >
                  <option value="Submitted">Ontvangen (Submitted)</option>
                  <option value="In Design Process">In Design Process</option>
                  <option value="Review">Review</option>
                  <option value="Delivered">Klaar (Delivered)</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Toegewezen Designer / Admin</label>
                <select 
                  value={editDesignerId}
                  onChange={(e) => setEditDesignerId(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                >
                  <option value="">Niet toegewezen</option>
                  {designers.map(d => (
                    <option key={d.id} value={d.id.toString()}>{d.full_name || d.email} ({d.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Revisies Teller</label>
                <input 
                  type="number" 
                  min="0"
                  value={editReviewCount}
                  onChange={(e) => setEditReviewCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Oplever URL (Design bestand)</label>
                <input 
                  type="url" 
                  value={editDeliveryUrl}
                  onChange={(e) => setEditDeliveryUrl(e.target.value)}
                  placeholder="https://figma.com/... of https://drive.google.com/..."
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="flex-1 py-3 bg-black/5 hover:bg-black/10 text-black rounded-xl text-xs font-bold transition-all"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#006663] text-white hover:bg-opacity-90 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  {saving && <Loader2 className="animate-spin" size={14} />}
                  Bijwerken
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Chat Overleg Modal Drawer */}
      {chattingRequest && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setChattingRequest(null)} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-black/80 truncate max-w-[250px]">{chattingRequest.title}</h4>
                <p className="text-[10px] text-black/40 font-bold uppercase tracking-wider mt-0.5">Design Overleg</p>
              </div>
              <button onClick={() => setChattingRequest(null)} className="p-2 hover:bg-black/5 rounded-full text-black/40 hover:text-black">
                <X size={20} />
              </button>
            </div>

            {/* Message Pane */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#f8f9fa] custom-scrollbar">
              {chatMessages.map((msg) => {
                const sender = users.find(u => u.id === msg.sender_id);
                const isMe = msg.sender_id === Number(editingRequest?.designer_id || 1); // Mock designer is admin

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-bold text-black/30 mb-1 px-1">
                      {sender?.full_name || sender?.email || 'Gebruker'}
                    </span>
                    <div className={`p-4 rounded-2xl max-w-[80%] text-xs font-semibold leading-relaxed ${
                      isMe 
                        ? 'bg-[#006663] text-white rounded-tr-none' 
                        : 'bg-white text-black/80 shadow-sm border border-black/5 rounded-tl-none'
                    }`}>
                      {msg.message_text}
                    </div>
                    <span className="text-[8px] font-semibold text-black/30 mt-1 px-1">
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </span>
                  </div>
                );
              })}

              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-black/30 p-8">
                  <MessageSquare size={32} className="mb-3 opacity-40" />
                  <p className="text-xs font-bold uppercase tracking-wider">Start de discussie</p>
                  <p className="text-[10px] font-medium mt-1">Stuur een bericht naar de klant om feedback en details af te stemmen.</p>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5 bg-white flex items-center gap-2">
              <input 
                type="text" 
                required
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Typ een overleg bericht..."
                className="flex-1 px-4 py-3 bg-black/5 rounded-full border border-transparent outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
              />
              <button 
                type="submit"
                disabled={sendingMessage || !newMessageText.trim()}
                className="w-10 h-10 bg-[#006663] text-white hover:bg-opacity-90 disabled:opacity-50 rounded-full flex items-center justify-center transition-all"
              >
                {sendingMessage ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
