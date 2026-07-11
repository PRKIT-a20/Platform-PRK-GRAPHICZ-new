import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Download, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  LogOut,
  ChevronRight,
  FileText,
  Loader2,
  ShieldCheck,
  Calendar,
  Briefcase,
  Shield,
  Image as ImageIcon,
  Target,
  BookOpen,
  Map,
  Share2,
  LayoutDashboard,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import InvoiceList from '../components/InvoiceList';
import ClientInvoiceUpload from '../components/ClientInvoiceUpload';
import ClientUploadedInvoicesList from '../components/ClientUploadedInvoicesList';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

import ProcessTracker from '../components/ProcessTracker';
import SmartRequestForm from '../components/SmartRequestForm';

interface Request {
  id: string;
  project_nr?: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'delivered' | 'Submitted' | 'In Design Process' | 'Review' | 'Delivered';
  created_at: string;
  delivery_url?: string;
  review_count?: number;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [invoiceRefresh, setInvoiceRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'planner' | 'billing' | 'projects' | 'vault' | 'proofing' | 'strategy' | 'wiki' | 'roadmap' | 'settings'>('overview');
  
  // Custom modal states
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('requests')
        .insert([
          { 
            user_id: user.id,
            title: newTitle, 
            description: newDescription,
            status: 'pending'
          }
        ]);

      if (error) throw error;
      
      setNewTitle('');
      setNewDescription('');
      setShowNewRequest(false);
      fetchRequests();
    } catch (error) {
      console.error('Failed to create request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteRequest = async () => {
    if (!requestToDelete) return;
    
    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', requestToDelete);

      if (error) throw error;
      
      // Update local state to remove the deleted request
      setRequests(requests.filter(req => req.id !== requestToDelete));
    } catch (error) {
      console.error('Failed to delete request:', error);
      setInfoMessage({ title: 'Error', message: 'Failed to delete request. Please try again.' });
    } finally {
      setRequestToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
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
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-black/5 flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex'}`}>
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <span className="px-2 py-1 bg-black/5 text-black/40 text-[8px] font-black uppercase tracking-tighter rounded-md">Admin Mode</span>
            )}
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-black/40 hover:text-black">
              <X size={20} />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => handleTabClick('overview')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>
          <button 
            onClick={() => handleTabClick('requests')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'requests' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <FileText size={18} />
            Request Panel
          </button>
          <button 
            onClick={() => handleTabClick('projects')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'projects' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <Briefcase size={18} />
            Projects Panel
          </button>
          <button 
            onClick={() => handleTabClick('planner')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'planner' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <Calendar size={18} />
            Content Planner
          </button>
          <button 
            onClick={() => handleTabClick('vault')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'vault' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <Shield size={18} />
            Brand Vault
          </button>
          <button 
            onClick={() => handleTabClick('proofing')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'proofing' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <ImageIcon size={18} />
            Proofing Gallery
          </button>
          <button 
            onClick={() => handleTabClick('strategy')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'strategy' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <Target size={18} />
            Strategy Board
          </button>
          <button 
            onClick={() => handleTabClick('wiki')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'wiki' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <BookOpen size={18} />
            Resource Wiki
          </button>
          <button 
            onClick={() => handleTabClick('roadmap')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'roadmap' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <Map size={18} />
            Process Tracker
          </button>
          <button 
            onClick={() => handleTabClick('billing')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'billing' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <CreditCard size={18} />
            Billing/Receipts
          </button>
          <div className="pt-4 pb-2 px-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/20">Account</p>
          </div>
          {(user?.role === 'admin' || user?.email === 'prkgraphicz@gmail.com') && (
            <Link 
              to="/admin"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-black/40 hover:bg-brand-primary hover:text-brand-secondary rounded-xl font-bold text-sm transition-all"
            >
              <ShieldCheck size={18} />
              Admin Panel
            </Link>
          )}
          <button 
            onClick={() => handleTabClick('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <Settings size={18} />
            Settings
          </button>
        </nav>
        <div className="p-4 border-t border-black/5">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 bg-white rounded-xl border border-black/5 text-black/60 hover:text-black"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">
                {activeTab === 'overview' ? `Welcome, ${user?.email.split('@')[0]}` : activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}
              </h1>
              <p className="text-black/40 font-medium">
                {activeTab === 'overview' ? 'Manage your design requests and assets' : `Access your ${activeTab} tools and information`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowNewRequest(true)}
            className="flex items-center justify-center gap-2 bg-brand-primary text-brand-secondary px-6 py-3 rounded-full font-bold text-sm hover:bg-brand-secondary hover:text-brand-primary transition-all shadow-lg shadow-brand-primary/10 w-full md:w-auto"
          >
            <Plus size={18} />
            New Request
          </button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-black/20" size={40} />
          </div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-12">
            {/* Bento Grid Features */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <button 
                onClick={() => setActiveTab('planner')}
                className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-black/5 hover:shadow-2xl hover:shadow-black/5 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calendar size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Content Planner</h3>
                <p className="text-black/40 text-sm font-medium">Schedule and visualize upcoming posts.</p>
              </button>

              <button 
                onClick={() => setActiveTab('billing')}
                className="bg-white p-8 rounded-[2.5rem] border border-black/5 hover:shadow-2xl hover:shadow-black/5 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CreditCard size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Billing</h3>
                <p className="text-black/40 text-sm font-medium">Manage invoices.</p>
              </button>

              <button 
                onClick={() => setActiveTab('vault')}
                className="bg-white p-8 rounded-[2.5rem] border border-black/5 hover:shadow-2xl hover:shadow-black/5 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Brand Vault</h3>
                <p className="text-black/40 text-sm font-medium">Logos & colors.</p>
              </button>

              <button 
                onClick={() => setActiveTab('projects')}
                className="bg-white p-8 rounded-[2.5rem] border border-black/5 hover:shadow-2xl hover:shadow-black/5 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Briefcase size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Projects</h3>
                <p className="text-black/40 text-sm font-medium">Track active work.</p>
              </button>

              <button 
                onClick={() => setActiveTab('proofing')}
                className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-black/5 hover:shadow-2xl hover:shadow-black/5 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ImageIcon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Proofing Gallery</h3>
                <p className="text-black/40 text-sm font-medium">Centralized feedback on designs.</p>
              </button>

              <button 
                onClick={() => setActiveTab('strategy')}
                className="bg-white p-8 rounded-[2.5rem] border border-black/5 hover:shadow-2xl hover:shadow-black/5 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Strategy</h3>
                <p className="text-black/40 text-sm font-medium">Brand goals.</p>
              </button>

              <button 
                onClick={() => setActiveTab('wiki')}
                className="bg-white p-8 rounded-[2.5rem] border border-black/5 hover:shadow-2xl hover:shadow-black/5 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Wiki</h3>
                <p className="text-black/40 text-sm font-medium">Educational guides.</p>
              </button>

              <button 
                onClick={() => setActiveTab('roadmap')}
                className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-black/5 hover:shadow-2xl hover:shadow-black/5 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-cyan-50 text-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Map size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Process Tracker</h3>
                <p className="text-black/40 text-sm font-medium">Visual roadmap of the project lifecycle.</p>
              </button>
            </div>

              {/* Recent Requests Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Recent Requests</h2>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className="text-sm font-bold text-brand-primary hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {requests.slice(0, 3).map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-3xl border border-black/5 flex items-center justify-between hover:shadow-xl hover:shadow-black/5 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusColor(request.status || 'pending').split(' ')[0]}`}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold">{request.title}</h3>
                        <p className="text-xs text-black/40 font-medium">{request.created_at ? format(new Date(request.created_at), 'MMM d, yyyy') : 'Unknown Date'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(request.status || 'pending')}`}>
                      {(request.status || 'pending').replace('_', ' ')}
                    </span>
                  </motion.div>
                ))}
                {requests.length === 0 && (
                  <div className="bg-white p-12 rounded-3xl border border-black/5 text-center">
                    <p className="text-black/40 font-medium">No requests yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'requests' ? (
          <div className="grid grid-cols-1 gap-6">
            {requests.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-black/5 text-center">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="text-black/20" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">No requests yet</h3>
                <p className="text-black/40 mb-8 max-w-xs mx-auto">Start your first design project by clicking the button above.</p>
                <button 
                  onClick={() => setShowNewRequest(true)}
                  className="text-black font-bold hover:underline"
                >
                  Create your first request
                </button>
              </div>
            ) : (
              requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-3xl border border-black/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-black/5 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{request.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(request.status || 'pending')}`}>
                        {(request.status || 'pending').replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-black/50 text-sm line-clamp-1 mb-2">{request.description}</p>
                    <div className="flex items-center gap-4 text-xs font-medium text-black/30">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {request.created_at ? format(new Date(request.created_at), 'MMM d, yyyy') : 'Unknown Date'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {request.status === 'delivered' && request.delivery_url && (
                      <a 
                        href={request.delivery_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-600 transition-all"
                      >
                        <Download size={16} />
                        Download
                      </a>
                    )}
                    <button 
                      onClick={() => setInfoMessage({ title: 'Coming Soon', message: 'Chat functionaliteit komt binnenkort!' })}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-black/5 text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-black/10 transition-all"
                    >
                      <MessageSquare size={16} />
                      Chat
                    </button>
                    <button 
                      onClick={() => setRequestToDelete(request.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete request"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button 
                      onClick={() => setInfoMessage({ title: 'Coming Soon', message: 'Details pagina komt binnenkort!' })}
                      className="p-2 text-black/20 hover:text-black transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : activeTab === 'billing' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ClientInvoiceUpload onUploadSuccess={() => setInvoiceRefresh(prev => prev + 1)} />
              <ClientUploadedInvoicesList refreshTrigger={invoiceRefresh} />
            </div>
            <div className="grid grid-cols-1 gap-8">
              <InvoiceList />
            </div>
          </div>
        ) : activeTab === 'roadmap' ? (
          <div className="space-y-8">
            <ProcessTracker userId={user?.id} />
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-2xl space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5">
              <h2 className="text-xl font-bold mb-6">Profile Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    readOnly 
                    value={user?.email || ''} 
                    className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium text-black/60 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Account Role</label>
                  <div className="px-4 py-4 bg-black/5 border border-transparent rounded-2xl font-medium text-black/60 capitalize">
                    {user?.role}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5">
              <h2 className="text-xl font-bold mb-6">Security</h2>
              <button className="w-full py-4 bg-black/5 text-black rounded-2xl font-bold hover:bg-black/10 transition-all">
                Change Password
              </button>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5">
              <h2 className="text-xl font-bold mb-6 text-red-500">Danger Zone</h2>
              <p className="text-black/40 text-sm mb-6 font-medium">Once you delete your account, there is no going back. Please be certain.</p>
              <button className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-all">
                Delete Account
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-20 rounded-[3rem] border border-black/5 text-center">
            <div className="w-20 h-20 bg-black/5 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Loader2 className="text-black/20" size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-4">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} is coming soon</h3>
            <p className="text-black/40 max-w-md mx-auto font-medium">We're currently building out this feature to provide you with the best possible experience. Stay tuned!</p>
          </div>
        )}
      </main>

      {/* New Request Modal */}
      <AnimatePresence>
        {showNewRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewRequest(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white p-10 rounded-3xl shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Nieuwe Design Aanvraag</h2>
              <SmartRequestForm 
                userId={user?.id} 
                onSuccess={() => {
                  setShowNewRequest(false);
                  fetchRequests();
                }}
                onCancel={() => setShowNewRequest(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {requestToDelete !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRequestToDelete(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Delete Request?</h2>
              <p className="text-black/60 mb-8">Are you sure you want to delete this request? This action cannot be undone.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setRequestToDelete(null)}
                  className="flex-1 py-4 bg-black/5 text-black rounded-2xl font-bold hover:bg-black/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteRequest}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {infoMessage !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoMessage(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white p-8 rounded-3xl shadow-2xl text-center"
            >
              <h2 className="text-xl font-bold mb-2">{infoMessage.title}</h2>
              <p className="text-black/60 mb-8">{infoMessage.message}</p>
              <button 
                onClick={() => setInfoMessage(null)}
                className="w-full py-4 bg-brand-primary text-brand-secondary rounded-2xl font-bold hover:bg-brand-secondary hover:text-brand-primary transition-all"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
