import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
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
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  client_id: number | null;
  designer_id: number | null;
  status: 'briefing' | 'design' | 'review' | 'completed' | string;
  due_date: string | null;
  progress: number;
  created_at: string;
}

interface UserRecord {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
}

export const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [designerId, setDesignerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('briefing');
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjectsAndUsers();
  }, []);

  const fetchProjectsAndUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projRes, usersRes] = await Promise.all([
        apiFetch<Project[]>('/api/projects'),
        apiFetch<UserRecord[]>('/api/users')
      ]);

      setProjects(projRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Failed to load projects & users:', err);
      setError('Could not fetch projects or users database.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    setEditingProject(null);
    setName('');
    setDescription('');
    setClientId('');
    setDesignerId('');
    setDueDate('');
    setStatus('briefing');
    setProgress(0);
  };

  const handleOpenEdit = (proj: Project) => {
    setEditingProject(proj);
    setIsCreateOpen(false);
    setName(proj.name);
    setDescription(proj.description || '');
    setClientId(proj.client_id?.toString() || '');
    setDesignerId(proj.designer_id?.toString() || '');
    setDueDate(proj.due_date ? proj.due_date.substring(0, 10) : '');
    setStatus(proj.status);
    setProgress(proj.progress || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        client_id: clientId ? Number(clientId) : null,
        designer_id: designerId ? Number(designerId) : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status,
        progress: Number(progress)
      };

      if (editingProject) {
        // Edit project
        const res = await apiFetch<Project>(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        if (res.data) {
          setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...payload } : p));
          setEditingProject(null);
        }
      } else {
        // Create project
        const res = await apiFetch<Project>('/api/projects', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res.data) {
          const addedProj = Array.isArray(res.data) ? res.data[0] : res.data;
          setProjects(prev => [addedProj, ...prev]);
          setIsCreateOpen(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to save project:', err);
      setError(err.message || 'Saving project failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Weet u zeker dat u dit project wilt verwijderen?')) return;

    try {
      setError(null);
      await apiFetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      setError(err.message || 'Deleting project failed.');
    }
  };

  const getStatusLabelColor = (status: string) => {
    switch (status) {
      case 'briefing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'design': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'review': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-black/60 border-gray-200';
    }
  };

  const clients = users.filter(u => u.role === 'client');
  const designers = users.filter(u => u.role === 'designer' || u.role === 'admin' || u.role === 'super_admin');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#006663]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-black/80">Projectenbeheer</h3>
        <button 
          onClick={handleOpenCreate}
          className="bg-[#006663] text-white hover:bg-opacity-90 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus size={14} />
          Nieuw Project Starten
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => {
          const client = users.find(u => u.id === proj.client_id);
          const designer = users.find(u => u.id === proj.designer_id);
          const clientName = client?.full_name || client?.email || 'Niet gekoppeld';
          const designerName = designer?.full_name || designer?.email || 'Niet toegewezen';

          return (
            <div 
              key={proj.id}
              className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${getStatusLabelColor(proj.status)}`}>
                    {proj.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenEdit(proj)}
                      className="p-1.5 hover:bg-black/5 rounded-lg text-[#006663] transition-colors"
                      title="Project bewerken"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(proj.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                      title="Project verwijderen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-bold text-black/80 mb-2">{proj.name}</h4>
                <p className="text-black/40 text-xs font-semibold leading-relaxed mb-6 line-clamp-2">
                  {proj.description || 'Geen projectbeschrijving.'}
                </p>

                <div className="border-t border-black/5 pt-4 space-y-2 mb-6">
                  <div className="flex justify-between text-[10px] font-bold text-black/40">
                    <span>Klant</span>
                    <span className="text-black/70 font-semibold">{clientName}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-black/40">
                    <span>Designer</span>
                    <span className="text-black/70 font-semibold">{designerName}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-black/40">
                    <span>Deadline</span>
                    <span className="text-black/70 font-semibold">
                      {proj.due_date ? format(new Date(proj.due_date), 'MMM d, yyyy') : 'Geen'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wider text-black/40">
                  <span>Voortgang</span>
                  <span>{proj.progress}%</span>
                </div>
                <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#006663] h-full transition-all duration-500" 
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-black/5 text-center text-black/40 font-semibold">
            Er zijn nog geen projecten gestart.
          </div>
        )}
      </div>

      {/* Create / Edit Project Modal */}
      {(isCreateOpen || editingProject) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsCreateOpen(false); setEditingProject(null); }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-6">
              <h4 className="font-bold text-lg text-black/80">
                {editingProject ? 'Project Wijzigen' : 'Nieuw Project Starten'}
              </h4>
              <button 
                onClick={() => { setIsCreateOpen(false); setEditingProject(null); }} 
                className="text-black/40 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Project Naam</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  placeholder="Bijv. Rebranding Herfst Campagne"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Beschrijving</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all h-20 resize-none"
                  placeholder="Briefing details of project scope..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Client</label>
                  <select 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  >
                    <option value="">Selecteer klant</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id.toString()}>{c.full_name || c.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Designer</label>
                  <select 
                    value={designerId}
                    onChange={(e) => setDesignerId(e.target.value)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  >
                    <option value="">Selecteer designer</option>
                    {designers.map(d => (
                      <option key={d.id} value={d.id.toString()}>{d.full_name || d.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Deadline</label>
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  >
                    <option value="briefing">Briefing</option>
                    <option value="design">Design</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Voortgang ({progress}%)</label>
                <input 
                  type="range" 
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-1.5 bg-black/5 rounded-full outline-none accent-[#006663] cursor-pointer"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); setEditingProject(null); }}
                  className="flex-1 py-3 bg-black/5 hover:bg-black/10 text-black rounded-xl text-xs font-bold transition-all"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#006663] text-white hover:bg-opacity-90 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  {saving && <Loader2 className="animate-spin" size={14} />}
                  {editingProject ? 'Opslaan' : 'Project Starten'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
