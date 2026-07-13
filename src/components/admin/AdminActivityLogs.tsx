import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { 
  Activity, 
  User, 
  Clock, 
  Loader2, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: number;
  action_type: string;
  entity_type: string;
  metadata: any;
  created_at: string;
}

interface UserRecord {
  id: number;
  email: string;
  full_name: string | null;
}

export const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogsAndUsers();
  }, []);

  const fetchLogsAndUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [logsRes, usersRes] = await Promise.all([
        apiFetch<ActivityLog[]>('/api/activity_logs'),
        apiFetch<UserRecord[]>('/api/users')
      ]);

      setLogs(logsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
      setError('Could not retrieve audit logs.');
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
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <h3 className="text-xl font-bold text-black/80">Platform Audit Logs</h3>
        <p className="text-xs text-black/40 font-medium mt-1">
          Chronologisch overzicht van alle cruciale acties die zijn uitgevoerd door gebruikers, designers of admins in het platform.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Log list */}
      <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/5 flex items-center gap-2">
          <Info size={16} className="text-[#006663]" />
          <span className="text-xs font-bold text-black/60 uppercase tracking-widest">Systeem Logs Timeline</span>
        </div>

        <div className="divide-y divide-black/5 max-h-[600px] overflow-y-auto custom-scrollbar">
          {logs.map((log) => {
            const user = users.find(u => u.id === log.user_id);
            const userName = user?.full_name || user?.email || `User #${log.user_id}`;

            return (
              <div key={log.id} className="p-6 hover:bg-black/[0.01] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-black/5 text-[#006663] flex items-center justify-center shrink-0">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-widest text-black/70">
                      {log.action_type?.replace(/_/g, ' ') || ''}
                    </h5>
                    <p className="text-sm font-semibold text-black/50 mt-1">
                      Uitgevoerd door: <span className="text-black/80">{userName}</span>
                    </p>
                    {log.metadata && (
                      <div className="mt-2 text-[10px] font-medium text-black/40 bg-black/5 px-3 py-2 rounded-xl max-w-xl border border-black/5 font-mono">
                        {typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-black/40 shrink-0 self-end md:self-center">
                  <Clock size={12} />
                  {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="p-12 text-center text-black/40 font-semibold text-sm">
              Geen logs gevonden.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
