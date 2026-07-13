import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Users, 
  Briefcase, 
  Loader2, 
  AlertTriangle,
  Mail,
  CheckCircle,
  Activity,
  Plus,
  X
} from 'lucide-react';
import { format } from 'date-fns';

interface DesignerUser {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  designer_id: number | null;
  status: string;
}

export const AdminDesigners: React.FC = () => {
  const [designers, setDesigners] = useState<DesignerUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDesignersAndProjects();
  }, []);

  const fetchDesignersAndProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, projectsRes] = await Promise.all([
        apiFetch<DesignerUser[]>('/api/users'),
        apiFetch<Project[]>('/api/projects')
      ]);

      const allUsers = usersRes.data || [];
      const allProjects = projectsRes.data || [];

      // Filter designers
      setDesigners(allUsers.filter(u => u.role === 'designer'));
      setProjects(allProjects);
    } catch (err) {
      console.error('Failed to load designers details:', err);
      setError('Could not load designer rosters or active workloads.');
    } finally {
      setLoading(false);
    }
  };

  const getDesignerProjects = (designerId: number) => {
    return projects.filter(p => p.designer_id === designerId && p.status !== 'completed');
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
        <h3 className="text-xl font-bold text-black/80">Designer Overzicht</h3>
        <p className="text-xs text-black/40 font-medium mt-1">
          Monitor de actieve workload van uw designers en stem de project-toewijzingen hier op af.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Designers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designers.map((designer) => {
          const designerActiveProjects = getDesignerProjects(designer.id);
          const workloadColor = designerActiveProjects.length > 4 
            ? 'text-red-500 bg-red-50' 
            : designerActiveProjects.length > 2 
            ? 'text-yellow-600 bg-yellow-50' 
            : 'text-green-600 bg-green-50';

          return (
            <div 
              key={designer.id} 
              className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-[#006663]/5 text-[#006663] rounded-2xl flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest ${workloadColor}`}>
                    Workload: {designerActiveProjects.length} Projecten
                  </span>
                </div>

                <h4 className="text-base font-bold text-black/80 mb-1">
                  {designer.full_name || 'Naam onbekend'}
                </h4>
                <p className="text-xs font-semibold text-black/40 mb-6 flex items-center gap-1.5">
                  <Mail size={12} />
                  {designer.email}
                </p>

                {/* Assigned Projects list */}
                <div className="border-t border-black/5 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-3">Actieve Projecten</p>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {designerActiveProjects.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 p-2 bg-black/5 rounded-xl">
                        <Briefcase size={12} className="text-black/30shrink-0" />
                        <span className="text-xs font-bold text-black/70 truncate">{p.name}</span>
                      </div>
                    ))}
                    {designerActiveProjects.length === 0 && (
                      <p className="text-[10px] font-medium text-black/30 italic">Geen lopende projecten op dit moment.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Joined date */}
              <div className="border-t border-black/5 pt-4 mt-6 text-[9px] font-bold text-black/30 uppercase tracking-widest">
                Geregistreerd op {format(new Date(designer.created_at), 'MMMM d, yyyy')}
              </div>
            </div>
          );
        })}

        {designers.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-black/5 text-center text-black/40 font-semibold">
            Er zijn nog geen designers geregistreerd op het platform.
          </div>
        )}
      </div>
    </div>
  );
};
