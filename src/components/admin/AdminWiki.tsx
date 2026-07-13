import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { 
  BookOpen, 
  Plus, 
  Loader2, 
  AlertTriangle, 
  X, 
  CheckCircle, 
  Edit,
  Eye,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface WikiArticle {
  id: string;
  client_id: number | null;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

interface UserRecord {
  id: number;
  email: string;
  full_name: string | null;
}

export const AdminWiki: React.FC = () => {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<WikiArticle | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Platform Guide');
  const [clientId, setClientId] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchArticlesAndUsers();
  }, []);

  const fetchArticlesAndUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [wikiRes, usersRes] = await Promise.all([
        apiFetch<WikiArticle[]>('/api/wiki_articles'),
        apiFetch<UserRecord[]>('/api/users')
      ]);

      setArticles(wikiRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Failed to load wiki articles:', err);
      setError('Could not fetch wiki directories.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    setEditingArticle(null);
    setTitle('');
    setContent('');
    setCategory('Platform Guide');
    setClientId('');
    setIsPublished(true);
  };

  const handleOpenEdit = (art: WikiArticle) => {
    setEditingArticle(art);
    setIsCreateOpen(false);
    setTitle(art.title);
    setContent(art.content);
    setCategory(art.category);
    setClientId(art.client_id?.toString() || '');
    setIsPublished(art.is_published);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: title.trim(),
        content: content.trim(),
        category,
        client_id: clientId ? Number(clientId) : null,
        is_published: isPublished
      };

      if (editingArticle) {
        // Edit
        const res = await apiFetch<WikiArticle>(`/api/wiki_articles/${editingArticle.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        if (res.data) {
          setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...payload } : a));
          setEditingArticle(null);
        }
      } else {
        // Create
        const res = await apiFetch<WikiArticle>('/api/wiki_articles', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res.data) {
          const addedArt = Array.isArray(res.data) ? res.data[0] : res.data;
          setArticles(prev => [addedArt, ...prev]);
          setIsCreateOpen(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to save wiki article:', err);
      setError(err.message || 'Saving article failed.');
    } finally {
      setSaving(false);
    }
  };

  const clients = users.filter(u => u.role === 'client');

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
        <h3 className="text-xl font-bold text-black/80">Kennisbank & Wiki Manager</h3>
        <button 
          onClick={handleOpenCreate}
          className="bg-[#006663] text-white hover:bg-opacity-90 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus size={14} />
          Artikel Toevoegen
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* List of articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((art) => {
          const client = users.find(u => u.id === art.client_id);
          const clientName = client ? (client.full_name || client.email) : 'Voor alle klanten';

          return (
            <div 
              key={art.id}
              className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-0.5 bg-black/5 text-black/50 border border-black/5 rounded-full text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                    <Tag size={10} />
                    {art.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest ${art.is_published ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {art.is_published ? 'Gepubliceerd' : 'Concept'}
                    </span>
                    <button 
                      onClick={() => handleOpenEdit(art)}
                      className="p-1 hover:bg-black/5 rounded-lg text-[#006663] transition-colors"
                      title="Artikel bewerken"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-bold text-black/80 mb-2">{art.title}</h4>
                <p className="text-black/40 text-xs font-semibold leading-relaxed mb-6 line-clamp-3">
                  {art.content}
                </p>
              </div>

              {/* Visibility and footer */}
              <div className="border-t border-black/5 pt-4 flex items-center justify-between text-[10px] font-bold text-black/40">
                <span className="flex items-center gap-1">
                  <Eye size={12} />
                  Zichtbaarheid: {clientName}
                </span>
                <span>{format(new Date(art.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          );
        })}

        {articles.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-black/5 text-center text-black/40 font-semibold">
            Er zijn nog geen wiki artikelen geschreven.
          </div>
        )}
      </div>

      {/* Create / Edit Article Modal */}
      {(isCreateOpen || editingArticle) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsCreateOpen(false); setEditingArticle(null); }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg bg-white p-8 rounded-3xl shadow-2xl text-left flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-6 shrink-0">
              <h4 className="font-bold text-lg text-black/80">
                {editingArticle ? 'Artikel Wijzigen' : 'Nieuw Artikel Toevoegen'}
              </h4>
              <button 
                onClick={() => { setIsCreateOpen(false); setEditingArticle(null); }} 
                className="text-black/40 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Titel van het Artikel</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  placeholder="Bijv. Social Media Beelden Richtlijnen"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Categorie</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  >
                    <option value="Platform Guide">Platform Guide</option>
                    <option value="Branding & Stijl">Branding & Stijl</option>
                    <option value="Social Creative">Social Creative</option>
                    <option value="Design Asset Wiki">Design Asset Wiki</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Klant Specifiek (Optioneel)</label>
                  <select 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  >
                    <option value="">Zichtbaar voor alle klanten</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id.toString()}>{c.full_name || c.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Artikel Inhoud</label>
                <textarea 
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all h-48 resize-none"
                  placeholder="Schrijf uw artikel, bestandsformaten, tutorials of antwoorden op veelgestelde vragen hier..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="pub"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="accent-[#006663] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="pub" className="text-xs font-bold text-black/60 cursor-pointer select-none">
                  Onmiddellijk publiceren voor geselecteerde doelgroep
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-black/5 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); setEditingArticle(null); }}
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
                  {editingArticle ? 'Opslaan' : 'Artikel Toevoegen'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
