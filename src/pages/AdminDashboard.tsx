import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Search,
  Filter,
  MoreVertical,
  Loader2,
  TrendingUp,
  BarChart3,
  Mail,
  MessageSquare,
  User,
  Menu,
  X,
  CreditCard
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import AdminInvoiceManager from '../components/AdminInvoiceManager';

interface Request {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'delivered' | 'Submitted' | 'In Design Process' | 'Review' | 'Delivered';
  created_at: string;
  delivery_url?: string;
  project_nr?: string;
  review_count?: number;
  product_type?: string;
}

interface ContactSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

interface Stats {
  totalUsers: { count: number };
  totalRequests: { count: number };
  pendingRequests: { count: number };
}

interface UserRecord {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'client';
  subscription_status: 'free' | 'pro' | 'enterprise';
  is_verified: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newReviewCount, setNewReviewCount] = useState(0);
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'users' | 'invoices'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, contactsRes, usersRes] = await Promise.all([
        supabase.from('requests').select('*').order('created_at', { ascending: false }),
        supabase.from('contact_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false })
      ]);
      
      const reqData = reqRes.data || [];
      const contactsData = contactsRes.data || [];
      const usersData = usersRes.data || [];
      
      setRequests(reqData);
      setContacts(contactsData);
      setUsers(usersData);

      setStats({
        totalUsers: { count: usersData.length },
        totalRequests: { count: reqData.length },
        pendingRequests: { count: reqData.filter(r => r.status === 'pending').length }
      });
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: newStatus, 
          delivery_url: deliveryUrl,
          review_count: newReviewCount
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;
      
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update request:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleInlineStatusUpdate = async (id: string, newStatus: string) => {
    // Optimistic update
    setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus as any } : req));
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to update status:', error);
      fetchData(); // Revert on error
    }
  };

  const handleInlineReviewUpdate = async (id: string, newCount: number) => {
    // Optimistic update
    setRequests(requests.map(req => req.id === id ? { ...req, review_count: newCount } : req));
    try {
      const { error } = await supabase
        .from('requests')
        .update({ review_count: newCount })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to update review count:', error);
      fetchData(); // Revert on error
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Design Process': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Review': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'Submitted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleTabClick = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-black/5 flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex'}`}>
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-brand-primary text-brand-secondary text-[8px] font-black uppercase tracking-tighter rounded-md">Admin</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-black/40 hover:text-black">
              <X size={20} />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => handleTabClick('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'overview' 
                ? 'bg-brand-primary text-brand-secondary' 
                : 'text-black/40 hover:bg-brand-primary hover:text-brand-secondary'
            }`}
          >
            <FileText size={18} />
            Requests
          </button>
          <button 
            onClick={() => handleTabClick('messages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'messages' 
                ? 'bg-brand-primary text-brand-secondary' 
                : 'text-black/40 hover:bg-brand-primary hover:text-brand-secondary'
            }`}
          >
            <MessageSquare size={18} />
            Inquiries
          </button>
          <button 
            onClick={() => handleTabClick('invoices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'invoices' 
                ? 'bg-brand-primary text-brand-secondary' 
                : 'text-black/40 hover:bg-brand-primary hover:text-brand-secondary'
            }`}
          >
            <CreditCard size={18} />
            Invoices
          </button>
          <div className="pt-4 pb-2 px-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/20">System</p>
          </div>
          <button 
            onClick={() => handleTabClick('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'users' 
                ? 'bg-brand-primary text-brand-secondary' 
                : 'text-black/40 hover:bg-brand-primary hover:text-brand-secondary'
            }`}
          >
            <Users size={18} />
            User Management
          </button>
          <Link 
            to="/dashboard"
            className="w-full flex items-center gap-3 px-4 py-3 text-black/40 hover:bg-brand-primary hover:text-brand-secondary rounded-xl font-bold text-sm transition-all"
          >
            <User size={18} />
            View as Client
          </Link>
        </nav>
        <div className="p-4 border-t border-black/5">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-all">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 bg-white rounded-xl border border-black/5 text-black/60 hover:text-black"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-3xl font-bold tracking-tight">
              {activeTab === 'overview' ? 'Manage Requests' : activeTab === 'messages' ? 'Contact Inquiries' : activeTab === 'invoices' ? 'Invoice Management' : 'User Management'}
            </h1>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-black/5 rounded-full text-sm outline-none focus:border-black/20"
              />
            </div>
          </div>
        </header>

        {activeTab === 'overview' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                    <Users size={24} />
                  </div>
                  <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                    <TrendingUp size={12} /> +12%
                  </span>
                </div>
                <h3 className="text-black/40 text-sm font-bold uppercase tracking-widest mb-1">Total Users</h3>
                <p className="text-3xl font-bold">{stats?.totalUsers.count || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
                    <FileText size={24} />
                  </div>
                  <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                    <TrendingUp size={12} /> +5%
                  </span>
                </div>
                <h3 className="text-black/40 text-sm font-bold uppercase tracking-widest mb-1">Total Requests</h3>
                <p className="text-3xl font-bold">{stats?.totalRequests.count || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl">
                    <Clock size={24} />
                  </div>
                </div>
                <h3 className="text-black/40 text-sm font-bold uppercase tracking-widest mb-1">Pending</h3>
                <p className="text-3xl font-bold">{stats?.pendingRequests.count || 0}</p>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <h2 className="font-bold text-xl">Recent Requests</h2>
                <button className="flex items-center gap-2 text-sm font-bold text-black/40 hover:text-black transition-colors">
                  <Filter size={16} />
                  Filter
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/[0.02] text-[10px] font-bold uppercase tracking-widest text-black/40">
                      <th className="px-6 py-4">Project & Client</th>
                      <th className="px-6 py-4">Request Details</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Reviews</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Links</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {requests.map((request) => {
                      const client = users.find(u => u.id === request.user_id);
                      const clientName = client?.full_name || client?.email || `User #${request.user_id?.substring(0, 8) || 'Unknown'}`;
                      
                      return (
                        <tr key={request.id} className="hover:bg-black/[0.01] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-brand-primary">{request.project_nr || `REQ-${request.id.substring(0,4)}`}</span>
                              <span className="text-xs text-black/60 font-medium">{clientName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <p className="text-sm font-bold truncate">{request.title || request.product_type}</p>
                              <p className="text-xs text-black/40 truncate">{request.description}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={request.status || 'pending'}
                              onChange={(e) => handleInlineStatusUpdate(request.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer border text-center transition-all hover:opacity-80 ${getStatusColor(request.status || 'pending')}`}
                            >
                              <option value="Submitted">Ontvangen</option>
                              <option value="In Design Process">Bezig</option>
                              <option value="Review">Review</option>
                              <option value="Delivered">Klaar</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="0"
                              value={request.review_count || 0}
                              onChange={(e) => handleInlineReviewUpdate(request.id, parseInt(e.target.value) || 0)}
                              className="w-16 px-3 py-1.5 bg-black/5 border border-transparent rounded-lg text-sm font-bold outline-none focus:border-brand-primary focus:bg-white transition-all text-center"
                            />
                          </td>
                          <td className="px-6 py-4 text-xs text-black/40 font-medium">
                            {request.created_at ? format(new Date(request.created_at), 'MMM d, yyyy') : 'Unknown Date'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => {
                                setSelectedRequest(request);
                                setNewStatus(request.status);
                                setDeliveryUrl(request.delivery_url || '');
                                setNewReviewCount(request.review_count || 0);
                              }}
                              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                              title="Open Details"
                            >
                              <ExternalLink size={18} className="text-black/40" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'messages' ? (
          /* Messages Table */
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-black/5">
              <h2 className="font-bold text-xl">Inbound Inquiries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/[0.02] text-[10px] font-bold uppercase tracking-widest text-black/40">
                    <th className="px-6 py-4">Sender</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Message Preview</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold">{contact.first_name} {contact.last_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-black/60 font-medium">{contact.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-black/60 truncate max-w-xs">{contact.message}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-black/40 font-medium">
                        {format(new Date(contact.created_at), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedContact(contact)}
                          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                        >
                          <Mail size={18} className="text-black/40" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-black/40 font-medium">
                        No messages yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'invoices' ? (
          <AdminInvoiceManager />
        ) : (
          /* Users Table */
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-black/5">
              <h2 className="font-bold text-xl">Registered Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/[0.02] text-[10px] font-bold uppercase tracking-widest text-black/40">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Subscription</th>
                    <th className="px-6 py-4">Verified</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{u.full_name || u.email}</span>
                          <span className="text-[10px] text-black/40">{u.full_name ? u.email : `ID: ${u.id.substring(0, 8)}`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${u.role === 'admin' ? 'bg-brand-primary text-brand-secondary' : 'bg-black/5 text-black/60'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium capitalize">{u.subscription_status}</span>
                      </td>
                      <td className="px-6 py-4">
                        {u.is_verified ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : (
                          <Clock size={16} className="text-yellow-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-black/40 font-medium">
                        {format(new Date(u.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedUser(u)}
                          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                        >
                          <MoreVertical size={18} className="text-black/40" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Request Update Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg bg-white p-10 rounded-3xl shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Update Request</h2>
            <form onSubmit={handleUpdateStatus} className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Status</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium"
                >
                  <option value="pending">Pending (Oud)</option>
                  <option value="in_progress">In Progress (Oud)</option>
                  <option value="delivered">Delivered (Oud)</option>
                  <option value="Submitted">Ontvangen (Nieuw)</option>
                  <option value="In Design Process">Bezig (Nieuw)</option>
                  <option value="Review">Review (Nieuw)</option>
                  <option value="Delivered">Klaar (Nieuw)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Review Count</label>
                <input
                  type="number"
                  min="0"
                  value={newReviewCount}
                  onChange={(e) => setNewReviewCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Delivery URL (Optional)</label>
                <input
                  type="url"
                  value={deliveryUrl}
                  onChange={(e) => setDeliveryUrl(e.target.value)}
                  className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium"
                  placeholder="https://example.com/file.zip"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 py-4 bg-black/5 text-black rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-4 bg-brand-primary text-brand-secondary rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary hover:text-brand-primary transition-all"
                >
                  {updating ? <Loader2 className="animate-spin" /> : 'Update'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedContact(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl bg-white p-10 rounded-3xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">{selectedContact.first_name} {selectedContact.last_name}</h2>
                <p className="text-brand-primary font-medium">{selectedContact.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-black/40 font-bold uppercase tracking-widest">Received</p>
                <p className="text-sm font-bold">{format(new Date(selectedContact.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
            
            <div className="bg-black/5 p-8 rounded-2xl mb-8">
              <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-4">Message</h4>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{selectedContact.message}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedContact(null)}
                className="flex-1 py-4 bg-black/5 text-black rounded-2xl font-bold"
              >
                Close
              </button>
              <a
                href={`mailto:${selectedContact.email}`}
                className="flex-1 py-4 bg-brand-primary text-brand-secondary rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary hover:text-brand-primary transition-all"
              >
                <Mail size={18} />
                Reply via Email
              </a>
            </div>
          </motion.div>
        </div>
      )}
      {/* User Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg bg-white p-10 rounded-3xl shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-2">Edit User</h2>
            <p className="text-black/40 text-sm mb-8 font-medium">{selectedUser.email}</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Role</label>
                <select 
                  value={selectedUser.role}
                  onChange={(e) => {
                    const newRole = e.target.value as 'admin' | 'client';
                    setSelectedUser({ ...selectedUser, role: newRole });
                  }}
                  className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Subscription</label>
                <select 
                  value={selectedUser.subscription_status}
                  onChange={(e) => {
                    const newStatus = e.target.value as 'free' | 'pro' | 'enterprise';
                    setSelectedUser({ ...selectedUser, subscription_status: newStatus });
                  }}
                  className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-4 bg-black/5 text-black rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setUpdating(true);
                    try {
                      const { error } = await supabase
                        .from('users')
                        .update({ 
                          role: selectedUser.role, 
                          subscription_status: selectedUser.subscription_status 
                        })
                        .eq('id', selectedUser.id);

                      if (error) throw error;
                      
                      setSelectedUser(null);
                      fetchData();
                    } catch (error) {
                      console.error('Failed to update user:', error);
                    } finally {
                      setUpdating(false);
                    }
                  }}
                  disabled={updating}
                  className="flex-1 py-4 bg-brand-primary text-brand-secondary rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary hover:text-brand-primary transition-all"
                >
                  {updating ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
