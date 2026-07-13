import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { 
  Briefcase, 
  User, 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertTriangle, 
  X,
  CheckCircle,
  FileText,
  MessageSquare,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

// Enhanced Project Interface
interface Project {
  id: string;
  name: string;
  description: string | null;
  client_id: number | null;
  designer_id: number | null;
  status: 'briefing' | 'design_phase' | 'client_review' | 'revision' | 'completed';
  due_date: string | null;
  progress: number;
  created_at: string;
  tasks: ProjectTask[];
  activity: ActivityLog[];
}

interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  due_date: string | null;
}

interface ActivityLog {
  id: string;
  description: string;
  created_at: string;
}

interface UserRecord {
  id: number;
  full_name: string | null;
  email: string;
  role: string;
}

export const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, usersRes] = await Promise.all([
        apiFetch<Project[]>('/api/admin/projects'),
        apiFetch<UserRecord[]>('/api/users')
      ]);
      setProjects(projRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold">Project Workspace</h2>
      
      {!selectedProject ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(proj => (
            <div key={proj.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all">
              <h4 className="font-bold">{proj.name}</h4>
              <p className="text-xs text-black/50 mb-4">{proj.status}</p>
              <button onClick={() => setSelectedProject(proj)} className="text-xs font-bold text-brand-primary">View Workspace</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-8">
          <button onClick={() => setSelectedProject(null)} className="text-xs font-bold text-brand-primary">← Back to Projects</button>
          <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
          {/* Workspace Content (Tasks, Details, Activity) */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-bold">Tasks</h4>
              {selectedProject.tasks.map(t => (
                <div key={t.id} className="p-4 bg-black/5 rounded-xl text-sm font-semibold">{t.title}</div>
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="font-bold">Activity</h4>
              {selectedProject.activity.map(a => (
                <div key={a.id} className="text-xs text-black/60 border-b border-black/5 pb-2">{a.description}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
