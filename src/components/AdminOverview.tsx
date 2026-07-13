import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Users, 
  FileText, 
  Clock, 
  TrendingUp, 
  Loader2, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Euro
} from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  totalUsers: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalInvoices: number;
  totalRevenue: number; // in EUR
}

interface ActivityLog {
  id: string;
  user_id: number;
  action_type: string;
  metadata: any;
  created_at: string;
}

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const [usersRes, reqRes, invoicesRes, logsRes] = await Promise.all([
        apiFetch<any[]>('/api/users'),
        apiFetch<any[]>('/api/requests'),
        apiFetch<any[]>('/api/invoices'),
        apiFetch<ActivityLog[]>('/api/activity_logs')
      ]);

      const users = usersRes.data || [];
      const requests = reqRes.data || [];
      const invoices = invoicesRes.data || [];
      const activityLogs = logsRes.data || [];

      // Calculate totals
      const totalUsers = users.length;
      const totalRequests = requests.length;
      const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'Submitted').length;
      const completedRequests = requests.filter(r => r.status === 'delivered' || r.status === 'Delivered').length;
      
      const paidInvoices = invoices.filter(i => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((acc, curr) => acc + (curr.amount || 0), 0) / 100;

      setStats({
        totalUsers,
        totalRequests,
        pendingRequests,
        completedRequests,
        totalInvoices: invoices.length,
        totalRevenue
      });

      setLogs(activityLogs.slice(0, 10)); // Top 10 recent actions
    } catch (err) {
      console.error('Failed to load admin overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#006663]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Clients */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Geregistreerde Klanten</p>
            <p className="text-3xl font-extrabold text-black/80">{stats?.totalUsers}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        {/* Requests */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Totaal Aanvragen</p>
            <p className="text-3xl font-extrabold text-black/80">{stats?.totalRequests}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
            <FileText size={20} />
          </div>
        </div>

        {/* Pending Queue */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">In Afwachting</p>
            <p className="text-3xl font-extrabold text-yellow-600">{stats?.pendingRequests}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Totaal Omzet</p>
            <p className="text-3xl font-extrabold text-green-600">€{stats?.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <Euro size={20} />
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-black/5 pb-4">
            <h3 className="font-bold text-lg text-black/80 flex items-center gap-2">
              <Activity size={18} className="text-[#006663]" />
              Recente Platform Activiteit
            </h3>
          </div>

          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 bg-black/5 rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-[#006663]/10 text-[#006663] flex items-center justify-center shrink-0">
                  <Activity size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-black/80 uppercase tracking-wide">
                    {log.action_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-black/40 font-semibold mt-0.5">
                    User ID: #{log.user_id} • {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                  {log.metadata && (
                    <p className="text-[10px] text-black/50 font-medium mt-1 bg-white/50 p-2 rounded-lg border border-black/5">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-center py-12 text-black/30 text-xs font-semibold">
                Nog geen platform activiteit geregistreerd.
              </div>
            )}
          </div>
        </div>

        {/* Platform Quick Health card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6">
          <h3 className="font-extrabold text-lg text-black/80">Platform Status</h3>
          
          <div className="space-y-4 font-semibold text-xs text-black/60">
            <div className="flex justify-between items-center p-3 bg-black/5 rounded-xl">
              <span>Database Ingress</span>
              <span className="text-green-600 font-bold flex items-center gap-1">
                <CheckCircle size={12} /> Actief
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-black/5 rounded-xl">
              <span>Aanvragen Succesrate</span>
              <span className="text-blue-500 font-bold">
                {stats && stats.totalRequests > 0 
                  ? `${Math.round((stats.completedRequests / stats.totalRequests) * 100)}%` 
                  : '100%'}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-black/5 rounded-xl">
              <span>In afwachting van review</span>
              <span className={stats && stats.pendingRequests > 5 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                {stats?.pendingRequests} aanvragen
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
