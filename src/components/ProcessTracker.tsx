import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Inbox, 
  PenTool, 
  MessageSquare, 
  CheckCircle2, 
  Loader2,
  AlertCircle
} from 'lucide-react';

interface TrackedRequest {
  id: number;
  project_nr: string;
  title: string;
  status: 'Submitted' | 'In Design Process' | 'Review' | 'Delivered';
  review_count: number;
}

interface ProcessTrackerProps {
  userId?: string;
}

const STATUS_STEPS = [
  { id: 'Submitted', label: 'Ontvangen', icon: Inbox },
  { id: 'In Design Process', label: 'Bezig', icon: PenTool },
  { id: 'Review', label: 'Review', icon: MessageSquare },
  { id: 'Delivered', label: 'Klaar', icon: CheckCircle2 },
];

const ProcessTracker: React.FC<ProcessTrackerProps> = ({ userId }) => {
  const [requests, setRequests] = useState<TrackedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    // 1. Initiële data ophalen
    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('requests')
          .select('id, project_nr, title, status, review_count')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } catch (err: any) {
        console.error('Error fetching requests for tracker:', err);
        setError('Kon de aanvragen niet laden. Controleer of de database kolommen bestaan.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // 2. Real-time updates instellen via Supabase Channels
    const channel = supabase
      .channel('public:requests')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time update ontvangen:', payload);
          setRequests((currentRequests) =>
            currentRequests.map((req) =>
              req.id === payload.new.id ? { ...req, ...payload.new } : req
            )
          );
        }
      )
      .subscribe();

    // Cleanup bij unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getStepStatus = (currentStatus: string, stepIndex: number) => {
    const currentIndex = STATUS_STEPS.findIndex(s => s.id === currentStatus);
    // Fallback voor onbekende statussen (bijv. 'pending')
    const normalizedCurrentIndex = currentIndex === -1 ? 0 : currentIndex;

    if (stepIndex < normalizedCurrentIndex) return 'completed';
    if (stepIndex === normalizedCurrentIndex) return 'current';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex items-start gap-3 border border-red-100">
        <AlertCircle className="shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold mb-1">Fout bij laden</h4>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[2.5rem] border border-black/5 text-center">
        <p className="text-black/40 font-medium">Je hebt nog geen actieve aanvragen om te volgen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {requests.map((request) => (
        <div key={request.id} className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all">
          
          {/* Header: Project Info & Review Counter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-black/5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-black/5 text-black/60 rounded-lg text-xs font-bold tracking-wider">
                  {request.project_nr || `REQ-${request.id}`}
                </span>
                <h3 className="text-xl font-bold text-gray-900">{request.title}</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100">
              <MessageSquare size={16} />
              <span className="text-sm font-bold">
                Reviews gebruikt: <span className="text-blue-900">{request.review_count || 0}</span>
              </span>
            </div>
          </div>

          {/* Horizontal Status Tracker */}
          <div className="relative">
            {/* Connecting Line Background */}
            <div className="absolute top-6 left-0 w-full h-1 bg-gray-100 rounded-full -z-10 hidden md:block"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-0">
              {STATUS_STEPS.map((step, index) => {
                const status = getStepStatus(request.status, index);
                const Icon = step.icon;
                
                // Styling logic based on status
                let iconBg = 'bg-gray-100 text-gray-400';
                let iconBorder = 'border-4 border-white';
                let textColor = 'text-gray-400';
                let lineActive = false;

                if (status === 'completed') {
                  iconBg = 'bg-green-500 text-white';
                  textColor = 'text-green-600 font-bold';
                  lineActive = true;
                } else if (status === 'current') {
                  iconBg = 'bg-brand-primary text-brand-secondary ring-4 ring-brand-primary/20';
                  textColor = 'text-brand-primary font-bold';
                  lineActive = true;
                }

                return (
                  <div key={step.id} className="relative flex md:flex-col items-center gap-4 md:gap-3 z-10">
                    {/* Active Line Fill (Mobile hidden, Desktop absolute) */}
                    {index > 0 && lineActive && (
                      <div className="absolute top-6 right-[50%] w-full h-1 bg-green-500 -z-10 hidden md:block"></div>
                    )}
                    {index > 0 && status === 'current' && (
                      <div className="absolute top-6 right-[50%] w-full h-1 bg-brand-primary -z-10 hidden md:block"></div>
                    )}

                    {/* Icon Circle */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${iconBg} ${iconBorder}`}>
                      <Icon size={20} />
                    </div>

                    {/* Label */}
                    <div className="md:text-center">
                      <p className={`text-sm transition-colors duration-500 ${textColor}`}>
                        {step.label}
                      </p>
                      {status === 'current' && (
                        <p className="text-[10px] uppercase tracking-widest text-brand-primary/60 font-bold mt-1 md:hidden">
                          Huidige Status
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};

export default ProcessTracker;
