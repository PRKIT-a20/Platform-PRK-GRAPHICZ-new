import React from 'react';
import { 
  Inbox, 
  PenTool, 
  MessageSquare, 
  CheckCircle2, 
  RefreshCw,
  FileText,
  AlertCircle
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
  status: string;
  activityLogs?: ActivityLog[];
  deadline?: string;
}

export const ProcessTracker: React.FC<ProcessTrackerProps> = ({ status, activityLogs = [], deadline }) => {
  const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === status);
  const normalizedIndex = currentIndex === -1 ? 0 : currentIndex;
  
  const progress = Math.round(((normalizedIndex + 1) / WORKFLOW_STEPS.length) * 100);

  return (
    <div className="space-y-8 bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Project Progress</h3>
        <span className="text-sm font-bold text-brand-primary">{progress}% Complete</span>
      </div>
      
      {/* Timeline */}
      <div className="relative">
        <div className="absolute top-6 left-0 w-full h-1 bg-gray-100 rounded-full hidden md:block"></div>
        <div className="absolute top-6 left-0 h-1 bg-brand-primary rounded-full hidden md:block" style={{ width: `${(normalizedIndex / (WORKFLOW_STEPS.length - 1)) * 100}%` }}></div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= normalizedIndex;
            const isCurrent = index === normalizedIndex;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-brand-primary text-brand-secondary' : 'bg-gray-100 text-gray-400'}`}>
                  <Icon size={20} />
                </div>
                <p className={`text-xs font-bold text-center ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Logs */}
      {activityLogs.length > 0 && (
        <div className="border-t border-black/5 pt-6">
          <h4 className="font-bold mb-4 text-sm">Recent Updates</h4>
          <div className="space-y-3">
            {activityLogs.map(log => (
              <div key={log.id} className="text-sm flex gap-4 text-black/60">
                <span className="text-black/40 text-xs w-20">{format(new Date(log.created_at), 'MMM d, HH:mm')}</span>
                <p>{log.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
