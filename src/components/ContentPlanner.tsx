import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit2, X, Loader2, Calendar, FileText, 
  CheckCircle2, AlertCircle, Eye, User, Mail, Filter, 
  Layers, Check, Sparkles, ChevronDown 
} from 'lucide-react';
import { storage } from '../lib/storage';

interface ContentPlannerRow {
  id: string;
  user_id: string;
  client_id: number | null;
  post_date: string | null;
  content_pillar: string | null;
  boost: string | null;
  concept: string | null;
  text_on_design: string | null;
  design_description: string | null;
  caption: string | null;
  notice: string | null;
  scheduled_date: string | null;
  title: string | null;
  content_type: string | null;
  description: string | null;
  status: string;
  created_at: string;
  client_name: string | null;
  client_email: string | null;
}

interface ClientUser {
  id: number;
  email: string;
  full_name: string | null;
}

export function ContentPlanner({ userId, isAdmin = false, clients: propClients }: { userId: string, isAdmin?: boolean, clients?: ClientUser[] }) {
  const [rows, setRows] = useState<ContentPlannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientUser[]>(propClients || []);
  const [selectedRow, setSelectedRow] = useState<ContentPlannerRow | null>(null);
  
  // Modal / Sidebar Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ContentPlannerRow | null>(null);
  const [formState, setFormState] = useState<Partial<ContentPlannerRow>>({});
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Filter state for Admin (filter items in view)
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (userId) {
      fetchPlanner();
    }
  }, [userId]);

  useEffect(() => {
    if (isAdmin && !propClients) {
      fetchClients();
    }
  }, [isAdmin, propClients]);

  useEffect(() => {
    if (propClients) {
        setClients(propClients);
    }
  }, [propClients]);

  const fetchPlanner = async () => {
    setLoading(true);
    try {
      const token = storage.get('token');
      const response = await fetch(`/api/content_planner/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      const plannerData = result && Array.isArray(result.data) ? result.data : [];
      setRows(plannerData);
    } catch (err) {
      console.error('Error fetching content planner:', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = storage.get('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      const clientsData = result && Array.isArray(result.data) ? result.data : [];
      setClients(clientsData);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setClients([]);
    }
  };

  const handleOpenAdd = () => {
    setEditingRow(null);
    setFormState({
      client_id: userId ? Number(userId) : null,
      title: '',
      content_type: '',
      description: '',
      post_date: '',
      content_pillar: '',
      concept: '',
      text_on_design: '',
      design_description: '',
      caption: '',
      notice: '',
      status: 'pending',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (row: ContentPlannerRow) => {
    setEditingRow(row);
    setFormState({ ...row });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    setFormError('');

    if (isAdmin && !formState.client_id) {
      setFormError('Please select a client.');
      setFormSaving(false);
      return;
    }

    if (!formState.title) {
      setFormError('Please enter a title.');
      setFormSaving(false);
      return;
    }

    try {
      const token = storage.get('token');
      const isEditing = !!editingRow;
      const url = isEditing ? `/api/content_planner/${editingRow.id}` : '/api/content_planner';
      const method = isEditing ? 'PUT' : 'POST';

      // Automatically find client name and email for visual updates
      const selectedClient = Array.isArray(clients) ? clients.find(c => c.id === Number(formState.client_id)) : undefined;
      const payload = {
        ...formState,
        // Fallback for user_id to match client_id
        user_id: formState.client_id,
      };

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const { data } = await response.json();

      if (!response.ok) {
        throw new Error('Failed to save planner item');
      }

      const returnedRow = Array.isArray(data) ? data[0] : data;

      if (isEditing) {
        setRows(prev => prev.map(r => r.id === returnedRow.id ? returnedRow : r));
      } else {
        setRows(prev => [returnedRow, ...prev]);
      }

      setIsFormOpen(false);
      setEditingRow(null);
      setFormState({});
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content request?')) return;
    try {
      const token = storage.get('token');
      const response = await fetch(`/api/content_planner/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setRows(prev => prev.filter(r => r.id !== id));
        if (selectedRow?.id === id) {
          setSelectedRow(null);
        }
      } else {
        alert('Failed to delete item');
      }
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'scheduled':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'review':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  const filteredRows = Array.isArray(rows) ? rows.filter(row => {
    if (statusFilter === 'all') return true;
    return row.status?.toLowerCase() === statusFilter.toLowerCase();
  }) : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-black/5">
        <Loader2 className="animate-spin text-brand-primary mb-4" size={40} />
        <p className="text-sm font-semibold text-black/40 uppercase tracking-widest">Loading content planner...</p>
      </div>
    );
  }

  const currentClientDetail = Array.isArray(clients) ? clients.find(c => c.id === Number(formState.client_id)) : undefined;

  return (
    <div className="space-y-8 relative">
      
      {/* Header and Filter Controls */}
      <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl">
            <Layers size={22} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Content Planner</h2>
            <p className="text-xs text-black/40 font-medium">Track client social campaigns and deliverables</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="relative flex items-center bg-black/5 px-3 py-1.5 rounded-xl border border-transparent">
            <Filter size={14} className="text-black/40 mr-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold uppercase tracking-wider bg-transparent outline-none cursor-pointer text-black/60 pr-4"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-brand-secondary rounded-xl font-bold hover:scale-105 hover:shadow-lg hover:shadow-brand-primary/10 transition-all text-xs uppercase tracking-wider"
            >
              <Plus size={16} /> New Request
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Planner Grid / List */}
        <div className="xl:col-span-2 space-y-4">
          {filteredRows.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border border-black/5 text-center shadow-sm">
              <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-black/20">
                <Layers size={32} />
              </div>
              <h3 className="text-lg font-bold mb-1">No planner entries found</h3>
              <p className="text-sm font-medium text-black/40 max-w-sm mx-auto">
                {isAdmin 
                  ? "Select a client or create a new planner request to begin tracking content details."
                  : "You do not have any content request updates assigned to your account yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRows.map((row, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  key={row.id}
                  onClick={() => setSelectedRow(row)}
                  className={`p-6 bg-white rounded-3xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                    selectedRow?.id === row.id 
                      ? 'border-brand-primary ring-2 ring-brand-primary/10' 
                      : 'border-black/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusStyle(row.status)}`}>
                      {row.status}
                    </span>
                    {row.post_date && (
                      <div className="flex items-center gap-1.5 text-xs text-black/40 font-bold">
                        <Calendar size={13} />
                        <span>{row.post_date}</span>
                      </div>
                    )}
                  </div>

                  <h4 className="font-extrabold text-base mb-1 text-black line-clamp-1">{row.title || 'Untitled Request'}</h4>
                  <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-3">
                    {row.content_type || 'Custom Deliverable'}
                  </p>

                  <p className="text-sm text-black/60 font-medium line-clamp-2 mb-4">
                    {row.description || row.concept || 'No description provided.'}
                  </p>

                  {/* Client Info Banner inside Card (Admin only) */}
                  {isAdmin && (
                    <div className="pt-4 border-t border-black/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-black/60 font-semibold">
                        <User size={12} className="text-black/30" />
                        <span className="truncate max-w-[120px]">{row.client_name || 'System Client'}</span>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="p-1.5 bg-black/5 text-black hover:bg-black/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side - Details Pane */}
        <div className="xl:col-span-1">
          <AnimatePresence mode="wait">
            {selectedRow ? (
              <motion.div
                key={selectedRow.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 space-y-6 sticky top-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusStyle(selectedRow.status)}`}>
                      {selectedRow.status}
                    </span>
                    <h3 className="font-extrabold text-lg mt-3 text-black">{selectedRow.title || 'Untitled Content'}</h3>
                    <p className="text-xs font-bold text-brand-primary uppercase tracking-wider">{selectedRow.content_type || 'Campaign Deliverable'}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedRow(null)} 
                    className="p-1.5 hover:bg-black/5 text-black/40 hover:text-black rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Client Relationship Details */}
                {isAdmin && (
                  <div className="p-4 bg-black/[0.02] border border-black/5 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Linked Client Profile</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-primary text-brand-secondary flex items-center justify-center font-bold text-xs uppercase">
                        {(selectedRow.client_name || selectedRow.client_email || '?')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-black truncate">{selectedRow.client_name || 'Unnamed Client'}</p>
                        <p className="text-[10px] text-black/40 font-medium truncate">{selectedRow.client_email || 'No email'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description and core fields */}
                <div className="space-y-4">
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5">Description</h5>
                    <p className="text-sm font-semibold text-black/70 bg-black/[0.01] p-3 rounded-xl border border-black/5 whitespace-pre-wrap min-h-[60px]">
                      {selectedRow.description || "No description provided."}
                    </p>
                  </div>

                  {selectedRow.post_date && (
                    <div className="flex items-center justify-between py-2 border-b border-black/5">
                      <span className="text-xs font-bold text-black/40 uppercase tracking-wider">Requested Delivery</span>
                      <span className="text-xs font-extrabold text-black">{selectedRow.post_date}</span>
                    </div>
                  )}

                  {selectedRow.content_pillar && (
                    <div className="flex items-center justify-between py-2 border-b border-black/5">
                      <span className="text-xs font-bold text-black/40 uppercase tracking-wider">Content Pillar</span>
                      <span className="text-xs font-extrabold text-black">{selectedRow.content_pillar}</span>
                    </div>
                  )}

                  {selectedRow.concept && (
                    <div className="flex items-center justify-between py-2 border-b border-black/5">
                      <span className="text-xs font-bold text-black/40 uppercase tracking-wider">Campaign Concept</span>
                      <span className="text-xs font-extrabold text-black">{selectedRow.concept}</span>
                    </div>
                  )}

                  {selectedRow.scheduled_date && (
                    <div className="flex items-center justify-between py-2 border-b border-black/5">
                      <span className="text-xs font-bold text-black/40 uppercase tracking-wider">Scheduled Post Date</span>
                      <span className="text-xs font-extrabold text-black">{selectedRow.scheduled_date}</span>
                    </div>
                  )}

                  {selectedRow.boost && (
                    <div className="flex items-center justify-between py-2 border-b border-black/5">
                      <span className="text-xs font-bold text-black/40 uppercase tracking-wider">Promotion Boost</span>
                      <span className="text-xs font-extrabold text-emerald-600">{selectedRow.boost}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Creatives Section */}
                {(selectedRow.text_on_design || selectedRow.design_description || selectedRow.caption || selectedRow.notice) && (
                  <div className="space-y-4 pt-4 border-t border-black/5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-black/40">Campaign Copy & Creatives</h4>
                    
                    {selectedRow.caption && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-black/40 uppercase">Caption Copy</span>
                        <div className="text-xs font-medium bg-black/[0.01] p-3 rounded-xl border border-black/5 whitespace-pre-wrap text-black/80">
                          {selectedRow.caption}
                        </div>
                      </div>
                    )}

                    {selectedRow.text_on_design && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-black/40 uppercase">Text on Design (TOD)</span>
                        <div className="text-xs font-medium bg-black/[0.01] p-3 rounded-xl border border-black/5 whitespace-pre-wrap text-black/80">
                          {selectedRow.text_on_design}
                        </div>
                      </div>
                    )}

                    {selectedRow.design_description && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-black/40 uppercase">Design Description</span>
                        <div className="text-xs font-medium bg-black/[0.01] p-3 rounded-xl border border-black/5 whitespace-pre-wrap text-black/80">
                          {selectedRow.design_description}
                        </div>
                      </div>
                    )}

                    {selectedRow.notice && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-black/40 uppercase">Internal Notes</span>
                        <div className="text-xs font-medium bg-black/[0.01] p-3 rounded-xl border border-black/5 whitespace-pre-wrap text-black/80">
                          {selectedRow.notice}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="hidden xl:block bg-black/[0.02] border border-dashed border-black/10 rounded-3xl p-10 text-center sticky top-6">
                <Sparkles size={28} className="mx-auto text-black/20 mb-3" />
                <h4 className="font-extrabold text-sm mb-1">Interactive Sidebar</h4>
                <p className="text-xs font-medium text-black/40 max-w-xs mx-auto">
                  Click on any planner request item to inspect complete description files, campaign assets, dates, and live status.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Admin Slideover / Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-white shadow-2xl p-8 overflow-y-auto flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-black">
                  {editingRow ? 'Edit Request' : 'New Content Request'}
                </h3>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 hover:bg-black/5 rounded-lg text-black/40 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5 flex-1 pb-12">
                {/* Client Selector (Admin only) */}
                {isAdmin ? (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">Assign Client</label>
                    <div className="relative">
                      <select
                        value={formState.client_id || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, client_id: Number(e.target.value) }))}
                        className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-xl outline-none focus:border-brand-primary focus:bg-white transition-all text-xs font-bold"
                        required
                      >
                        <option value="">Select a Client</option>
                        {Array.isArray(clients) && clients.map(c => (
                          <option key={c.id} value={c.id}>{c.full_name || c.email} ({c.email})</option>
                        ))}
                      </select>
                    </div>

                    {/* Client Metadata display */}
                    {formState.client_id && currentClientDetail && (
                      <div className="mt-2.5 p-3 bg-brand-primary/5 rounded-xl border border-brand-primary/10 flex items-center gap-3 text-xs">
                        <div className="w-7 h-7 rounded-full bg-brand-primary text-brand-secondary flex items-center justify-center font-bold">
                          {(currentClientDetail.full_name || currentClientDetail.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-black">{currentClientDetail.full_name || 'Unnamed Client'}</p>
                          <p className="text-[10px] text-black/40 font-medium">{currentClientDetail.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Hidden input mapping client self-ownership
                  <input type="hidden" value={userId} />
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">Request Title / Topic</label>
                  <input
                    type="text"
                    required
                    value={formState.title || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Summer Campaign Teaser"
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-xl outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">Content Type</label>
                  <input
                    type="text"
                    required
                    value={formState.content_type || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, content_type: e.target.value }))}
                    placeholder="e.g. Social Media Post, Blog, Email"
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-xl outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">Request Description</label>
                  <textarea
                    required
                    value={formState.description || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a detailed brief of the content request..."
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-xl outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-semibold min-h-[100px] resize-y"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">Deadline / Date</label>
                    <input
                      type="date"
                      value={formState.post_date || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, post_date: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-xl outline-none focus:border-brand-primary focus:bg-white transition-all text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">Workflow Status</label>
                    <select
                      value={formState.status || 'pending'}
                      onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-xl outline-none focus:border-brand-primary focus:bg-white transition-all text-xs font-bold"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="approved">Approved</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5 space-y-4">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-black/40">Additional Planner Parameters (Optional)</span>

                  <div>
                    <label className="block text-[10px] font-bold text-black/60 mb-1.5">Content Pillar</label>
                    <input
                      type="text"
                      value={formState.content_pillar || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, content_pillar: e.target.value }))}
                      placeholder="e.g. Brand awareness, Product promo"
                      className="w-full px-4 py-2.5 bg-black/5 border border-transparent rounded-xl outline-none focus:border-brand-primary focus:bg-white transition-all text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-black/60 mb-1.5">Caption Copy</label>
                    <textarea
                      value={formState.caption || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="Write social media captions or post body..."
                      className="w-full px-4 py-2.5 bg-black/5 border border-transparent rounded-xl outline-none focus:border-brand-primary focus:bg-white transition-all text-xs font-medium min-h-[70px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-black/60 mb-1.5">Text on Design (TOD)</label>
                    <input
                      type="text"
                      value={formState.text_on_design || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, text_on_design: e.target.value }))}
                      placeholder="Key typography overlay ideas"
                      className="w-full px-4 py-2.5 bg-black/5 border border-transparent rounded-xl outline-none focus:border-brand-primary focus:bg-white transition-all text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-black/60 mb-1.5">Design Description</label>
                    <textarea
                      value={formState.design_description || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, design_description: e.target.value }))}
                      placeholder="e.g. Pastel background with high contrast logo..."
                      className="w-full px-4 py-2.5 bg-black/5 border border-transparent rounded-xl outline-none focus:border-brand-primary focus:bg-white transition-all text-xs font-medium min-h-[60px]"
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-3 bg-black/5 text-black hover:bg-black/10 rounded-xl font-bold text-sm transition-all text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="flex-1 py-3 bg-brand-primary text-brand-secondary hover:scale-105 rounded-xl font-bold text-sm transition-all text-center flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {formSaving ? <Loader2 className="animate-spin" size={16} /> : 'Save Request'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
