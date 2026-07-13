import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../lib/localStorageDb';
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
  X,
  Key
} from 'lucide-react';
import InvoiceList from '../components/InvoiceList';
import { ContentPlanner } from "../components/ContentPlanner";
import ClientInvoiceUpload from '../components/ClientInvoiceUpload';
import ClientUploadedInvoicesList from '../components/ClientUploadedInvoicesList';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

import { ProcessTracker } from '../components/ProcessTracker';
import SmartRequestForm from '../components/SmartRequestForm';

// Client Modular Components (Phase 2B)
import { ClientOverview } from '../components/ClientOverview';
import { ClientRequestPanel } from '../components/ClientRequestPanel';
import { ClientProjectsPanel } from '../components/ClientProjectsPanel';
import { BrandVault } from '../components/BrandVault';
import { ProofingGallery } from '../components/ProofingGallery';
import { StrategyBoard } from '../components/StrategyBoard';
import { ResourceWiki } from '../components/ResourceWiki';
import { ClientCommunication } from '../components/ClientCommunication';
import { ClientBillingReceipts } from '../components/ClientBillingReceipts';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'planner' | 'billing' | 'projects' | 'vault' | 'proofing' | 'strategy' | 'wiki' | 'communication' | 'roadmap' | 'settings'>('overview');
  
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
      const { data, error } = await localDb
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
      const { error } = await localDb
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
      const { error } = await localDb
        .from('requests')
        .delete()
        .eq('id', requestToDelete);

      if (error) throw error;
      
      // Update local state to remove the deleted request
      setRequests(prev => prev.filter(req => req.id !== requestToDelete));
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
            onClick={() => handleTabClick('communication')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'communication' ? 'bg-brand-primary text-brand-secondary' : 'text-black/40 hover:bg-black/5'}`}
          >
            <MessageSquare size={18} />
            Communication Hub
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
          <Link 
            to="/change-password"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-black/40 hover:bg-brand-primary hover:text-brand-secondary rounded-xl font-bold text-sm transition-all animate-fade-in"
          >
            <Key size={18} />
            Change Password
          </Link>
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
                {activeTab === 'overview' ? `Welcome, ${user?.email?.split('@')[0] || ''}` : activeTab?.charAt(0).toUpperCase() + activeTab?.slice(1).replace(/([A-Z])/g, ' $1') || ''}
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
          <ClientOverview onNavigate={setActiveTab} />
        ) : activeTab === 'requests' ? (
          <ClientRequestPanel />
        ) : activeTab === 'projects' ? (
          <ClientProjectsPanel />
        ) : activeTab === 'vault' ? (
          <BrandVault />
        ) : activeTab === 'proofing' ? (
          <ProofingGallery />
        ) : activeTab === 'strategy' ? (
          <StrategyBoard />
        ) : activeTab === 'wiki' ? (
          <ResourceWiki />
        ) : activeTab === 'communication' ? (
          <ClientCommunication />
        ) : activeTab === 'billing' ? (
          <ClientBillingReceipts />
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
              <Link 
                to="/change-password"
                className="block text-center w-full py-4 bg-black/5 text-[#006663] rounded-2xl font-bold hover:bg-black/10 transition-all"
              >
                Change Password
              </Link>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5">
              <h2 className="text-xl font-bold mb-6 text-red-500">Danger Zone</h2>
              <p className="text-black/40 text-sm mb-6 font-medium">Once you delete your account, there is no going back. Please be certain.</p>
              <button className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-all">
                Delete Account
              </button>
            </div>
          </div>
        ) : activeTab === 'planner' ? (
          <div className="space-y-8">
            <ContentPlanner userId={user?.id?.toString() || ''} />
          </div>
        ) : (
          <div className="bg-white p-20 rounded-[3rem] border border-black/5 text-center">
            <div className="w-20 h-20 bg-black/5 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Loader2 className="text-black/20" size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-4">{(activeTab as string).charAt(0).toUpperCase() + (activeTab as string).slice(1)} is coming soon</h3>
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
