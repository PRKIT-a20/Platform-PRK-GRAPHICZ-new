import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Briefcase, 
  FileText, 
  Calendar, 
  Bell, 
  Image as ImageIcon, 
  CreditCard, 
  Loader2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  status: string;
  deadline: string | null;
  created_at: string;
}

interface Request {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string | null;
}

interface Gallery {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface ClientOverviewProps {
  onNavigate: (tab: any) => void;
}

export const ClientOverview: React.FC<ClientOverviewProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [projRes, reqRes, notifRes, invRes, galRes] = await Promise.all([
          apiFetch<Project[]>('/api/projects').catch(() => ({ data: [] })),
          apiFetch<Request[]>('/api/requests').catch(() => ({ data: [] })),
          apiFetch<Notification[]>('/api/notifications').catch(() => ({ data: [] })),
          apiFetch<Invoice[]>('/api/invoices').catch(() => ({ data: [] })),
          apiFetch<Gallery[]>('/api/proofing_galleries').catch(() => ({ data: [] }))
        ]);

        setProjects(projRes.data || []);
        setRequests(reqRes.data || []);
        setNotifications(notifRes.data || []);
        setInvoices(invRes.data || []);
        setGalleries(galRes.data || []);
      } catch (err: any) {
        console.error('Error fetching dashboard overview data:', err);
        setError('Failed to load dashboard overview data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-3xl text-red-600 flex items-center gap-3">
        <AlertCircle size={24} />
        <span className="font-semibold">{error}</span>
      </div>
    );
  }

  // Derived metrics
  const activeProjects = projects.filter(p => p.status !== 'completed');
  const openRequests = requests.filter(r => r.status === 'pending' || r.status === 'Submitted');
  
  // Next deadline
  const futureDeadlines = projects
    .filter(p => p.deadline && new Date(p.deadline) > new Date() && p.status !== 'completed')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  
  const nextDeadline = futureDeadlines[0] || null;

  // Latest invoice status
  const latestInvoice = invoices[0] || null;

  // Latest proofing activity
  const latestGallery = galleries[0] || null;

  return (
    <div className="space-y-10">
      {/* Metrics Row (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 bg-[#006663]/5 text-[#006663] rounded-xl flex items-center justify-center mb-4">
              <Briefcase size={20} />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-black/40">Active Projects</h4>
            <p className="text-4xl font-extrabold tracking-tight mt-1">{activeProjects.length}</p>
          </div>
          <button 
            onClick={() => onNavigate('projects')}
            className="text-xs font-bold text-[#006663] hover:underline flex items-center gap-1 mt-4"
          >
            Manage Projects <ArrowRight size={14} />
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 bg-[#ffd833]/10 text-yellow-600 rounded-xl flex items-center justify-center mb-4">
              <FileText size={20} />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-black/40">Open Requests</h4>
            <p className="text-4xl font-extrabold tracking-tight mt-1">{openRequests.length}</p>
          </div>
          <button 
            onClick={() => onNavigate('requests')}
            className="text-xs font-bold text-[#006663] hover:underline flex items-center gap-1 mt-4"
          >
            View Panel <ArrowRight size={14} />
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4">
              <Calendar size={20} />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-black/40">Next Deadline</h4>
            {nextDeadline ? (
              <div className="mt-1">
                <p className="text-xl font-bold truncate">{nextDeadline.name}</p>
                <p className="text-sm text-black/50 font-semibold">{format(new Date(nextDeadline.deadline!), 'MMM d, yyyy')}</p>
              </div>
            ) : (
              <p className="text-lg font-bold text-black/30 mt-2">No upcoming deadlines</p>
            )}
          </div>
          {nextDeadline && (
            <button 
              onClick={() => onNavigate('projects')}
              className="text-xs font-bold text-[#006663] hover:underline flex items-center gap-1 mt-4"
            >
              Project Details <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Latest Activity Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Proofing */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ImageIcon size={22} className="text-[#006663]" />
              Latest Proofing Activity
            </h3>
            {latestGallery ? (
              <div className="p-6 bg-[#f8f9fa] rounded-2xl border border-black/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-lg text-black/80">{latestGallery.title}</h4>
                  <p className="text-xs font-semibold text-black/40 mt-1">
                    Uploaded on {format(new Date(latestGallery.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    latestGallery.status === 'approved' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}>
                    {latestGallery.status?.replace('_', ' ') || ''}
                  </span>
                  <button 
                    onClick={() => onNavigate('proofing')}
                    className="px-4 py-2 bg-[#006663] text-white rounded-xl text-xs font-bold hover:bg-opacity-90 transition-all"
                  >
                    Open Gallery
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-[#f8f9fa] rounded-2xl border border-dashed border-black/10 text-center text-black/40 font-medium">
                No active proofing sessions yet.
              </div>
            )}
          </div>

          {/* Latest Invoice */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard size={22} className="text-[#006663]" />
              Latest Invoice Status
            </h3>
            {latestInvoice ? (
              <div className="p-6 bg-[#f8f9fa] rounded-2xl border border-black/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-black/80">{latestInvoice.invoice_number}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                      latestInvoice.status === 'paid' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : latestInvoice.status === 'overdue'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}>
                      {latestInvoice.status}
                    </span>
                  </div>
                  {latestInvoice.due_date && (
                    <p className="text-xs font-semibold text-black/40 mt-1">
                      Due Date: {format(new Date(latestInvoice.due_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-extrabold text-black/80">
                    €{(latestInvoice.amount / 100).toFixed(2)}
                  </span>
                  <button 
                    onClick={() => onNavigate('billing')}
                    className="px-4 py-2 bg-black/5 text-black hover:bg-black/10 rounded-xl text-xs font-bold transition-all"
                  >
                    View Invoices
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-[#f8f9fa] rounded-2xl border border-dashed border-black/10 text-center text-black/40 font-medium">
                No invoices issued yet.
              </div>
            )}
          </div>
        </div>

        {/* Notifications Sidebar */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Bell size={22} className="text-[#006663]" />
            Recent Notifications
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[360px] pr-2 custom-scrollbar">
            {notifications.slice(0, 5).map((notif) => (
              <div 
                key={notif.id}
                className={`p-4 rounded-2xl border border-black/5 transition-all text-left ${
                  notif.is_read ? 'bg-white' : 'bg-brand-primary/5 border-[#006663]/10'
                }`}
              >
                <h4 className="font-bold text-sm text-black/80">{notif.title}</h4>
                <p className="text-xs text-black/50 mt-1 line-clamp-2">{notif.message}</p>
                <p className="text-[10px] text-black/30 mt-2 font-semibold">
                  {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="py-12 text-center text-black/30 font-semibold text-sm">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
