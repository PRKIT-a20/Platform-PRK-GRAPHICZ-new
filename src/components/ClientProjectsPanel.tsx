import React, { useEffect, useState } from 'react';
import { localDb } from '../lib/localStorageDb';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, Briefcase, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  status: 'briefing' | 'design' | 'review' | 'revision' | 'completed';
  deadline: string;
  created_at: string;
  description: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

export const ClientProjectsPanel: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await localDb
        .from('projects')
        .select('*')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async (projectId: string) => {
    try {
      const { data, error } = await localDb
        .from('activity_logs')
        .select('*')
        .eq('module', 'projects')
        // Assuming activity_logs has a project_id column or description references project name
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  if (error) return <div className="p-6 bg-red-50 text-red-600 rounded-2xl">{error}</div>;

  return (
    <div className="space-y-6">
      {!selectedProject ? (
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Your Projects</h2>
          {projects.length === 0 ? (
            <p className="text-black/40">No projects found.</p>
          ) : (
            <div className="space-y-4">
              {projects.map(p => (
                <button 
                  key={p.id}
                  onClick={() => { setSelectedProject(p); fetchActivityLogs(p.id); }}
                  className="w-full flex items-center justify-between p-6 bg-black/[0.02] hover:bg-black/[0.04] rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm"><Briefcase size={20} className="text-brand-primary" /></div>
                    <div className="text-left">
                      <h4 className="font-bold">{p.name}</h4>
                      <p className="text-xs text-black/40 uppercase tracking-wide">{p.status}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-black/20" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setSelectedProject(null)} className="text-sm font-bold text-brand-primary hover:underline">← Back to Projects</button>
          <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">{selectedProject.name}</h2>
            <p className="text-black/60 mb-6">{selectedProject.description}</p>
            
            <div className="mb-8">
              <h3 className="font-bold mb-4">Project Status</h3>
              {/* Simple Timeline for now */}
              <div className="flex gap-2">
                {['briefing', 'design', 'review', 'revision', 'completed'].map((status) => (
                  <div key={status} className={`flex-1 h-2 rounded-full ${status === selectedProject.status ? 'bg-brand-primary' : 'bg-black/10'}`} />
                ))}
              </div>
              <p className="text-sm text-black/40 mt-2 font-medium capitalize">{selectedProject.status}</p>
            </div>

            <h3 className="font-bold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activityLogs.map(log => (
                <div key={log.id} className="text-sm flex gap-4 text-black/60">
                  <span className="text-black/40">{format(new Date(log.created_at), 'MMM d, HH:mm')}</span>
                  <p>{log.action} - {log.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
