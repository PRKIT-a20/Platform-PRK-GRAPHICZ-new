import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Inbox, 
  PenTool, 
  MessageSquare, 
  CheckCircle2, 
  RefreshCw,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

const WORKFLOW_STEPS = [
  { id: 'request_received', label: 'Request Received', icon: Inbox },
  { id: 'briefing', label: 'Briefing', icon: FileText },
  { id: 'design_phase', label: 'Design Phase', icon: PenTool },
  { id: 'client_review', label: 'Client Review', icon: MessageSquare },
  { id: 'revision', label: 'Revision', icon: RefreshCw },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

interface ProcessTrackerProps {
  status?: string;
  activityLogs?: ActivityLog[];
  deadline?: string;
  userId?: string;
}

export const ProcessTracker: React.FC<ProcessTrackerProps> = ({ 
  status: initialStatus, 
  activityLogs: initialLogs = [], 
  deadline: initialDeadline,
  userId
}) => {
  const [status, setStatus] = useState(initialStatus || 'briefing');
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [loading, setLoading] = useState(!initialStatus);

  useEffect(() => {
    if (!initialStatus && userId) {
      fetchActiveProject();
    }
  }, [userId, initialStatus]);

  const fetchActiveProject = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<any[]>('/api/projects');
      const activeProject = res.data?.find(p => p.status !== 'completed') || res.data?.[0];
      if (activeProject) {
        setStatus(activeProject.status || 'briefing');
      }
    } catch (err) {
      console.error('Failed to fetch project for tracker:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === status);
  const normalizedIndex = currentIndex === -1 ? 0 : currentIndex;
  
  const progress = Math.round(((normalizedIndex + 1) / WORKFLOW_STEPS.length) * 100);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="space-y-8 bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm text-left">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Project Progress</h3>
        <span className="text-sm font-bold text-[#006663]">{progress}% Complete</span>
      </div>
      
      {/* Timeline */}
      <div className="relative py-4">
        <div className="absolute top-10 left-0 w-full h-1 bg-black/5 rounded-full hidden md:block"></div>
        <div className="absolute top-10 left-0 h-1 bg-[#006663] rounded-full hidden md:block transition-all duration-500" style={{ width: `${(normalizedIndex / (WORKFLOW_STEPS.length - 1)) * 100}%` }}></div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative z-10">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= normalizedIndex;
            const isCurrent = index === normalizedIndex;

            return (
              <div key={step.id} className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border shadow-sm ${
                  isCurrent 
                    ? 'bg-[#006663] text-white border-[#006663] scale-110 shadow-[#006663]/20' 
                    : isCompleted 
                    ? 'bg-[#006663]/10 text-[#006663] border-[#006663]/20' 
                    : 'bg-white text-black/20 border-black/5'
                }`}>
                  <Icon size={20} />
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest text-center ${isCompleted ? 'text-black/80' : 'text-black/30'}`}>{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Logs */}
      {logs.length > 0 && (
        <div className="border-t border-black/5 pt-6">
          <h4 className="font-bold mb-4 text-sm text-black/80 flex items-center gap-2">
            <RefreshCw size={16} className="text-[#006663]" />
            Recent Updates
          </h4>
          <div className="space-y-4">
            {logs.map(log => (
              <div key={log.id} className="text-sm flex gap-4 text-black/60 bg-black/5 p-4 rounded-2xl border border-black/5">
                <span className="text-black/30 text-[10px] font-bold uppercase tracking-widest w-24 shrink-0">{format(new Date(log.created_at), 'MMM d, HH:mm')}</span>
                <p className="font-semibold">{log.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
