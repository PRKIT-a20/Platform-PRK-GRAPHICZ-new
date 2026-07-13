import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  ImageIcon, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertTriangle, 
  X, 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown,
  ExternalLink,
  Star,
  FileImage
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface ProofingGallery {
  id: string;
  project_id: string | null;
  client_id: number;
  title: string;
  description: string | null;
  status: string; // pending_review, approved, changes_requested
  created_at: string;
}

interface ProofingItem {
  id: string;
  gallery_id: string;
  title: string;
  description: string | null;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  favorite_count: number;
}

interface Project {
  id: string;
  name: string;
  client_id: number;
}

interface UserRecord {
  id: number;
  email: string;
  full_name: string | null;
}

export const AdminProofing: React.FC = () => {
  const [galleries, setGalleries] = useState<ProofingGallery[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded gallery view state
  const [selectedGallery, setSelectedGallery] = useState<ProofingGallery | null>(null);
  const [galleryItems, setGalleryItems] = useState<ProofingItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Modal forms
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  // Create Gallery Form
  const [galTitle, setGalTitle] = useState('');
  const [galDesc, setGalDesc] = useState('');
  const [galProjectId, setGalProjectId] = useState('');
  const [galClientId, setGalClientId] = useState('');
  const [savingGal, setSavingGal] = useState(false);

  // Add Item Form
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    fetchProofingData();
  }, []);

  const fetchProofingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [galRes, projRes, usersRes] = await Promise.all([
        apiFetch<ProofingGallery[]>('/api/proofing_galleries'),
        apiFetch<Project[]>('/api/projects'),
        apiFetch<UserRecord[]>('/api/users')
      ]);

      setGalleries(galRes.data || []);
      setProjects(projRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Failed to load proofing data:', err);
      setError('Could not fetch proofing galleries or projects.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGallery = async (gal: ProofingGallery) => {
    setSelectedGallery(gal);
    setItemsLoading(true);
    try {
      const res = await apiFetch<ProofingItem[]>(`/api/proofing_items?gallery_id=${gal.id}`);
      setGalleryItems(res.data || []);
    } catch (err) {
      console.error('Failed to load gallery items:', err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galTitle.trim() || !galClientId) return;

    try {
      setSavingGal(true);
      setError(null);

      const payload = {
        title: galTitle.trim(),
        description: galDesc.trim() || null,
        project_id: galProjectId || null,
        client_id: Number(galClientId)
      };

      const res = await apiFetch<ProofingGallery[]>('/api/proofing_galleries', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.data) {
        const addedGal = Array.isArray(res.data) ? res.data[0] : res.data;
        setGalleries(prev => [addedGal, ...prev]);
        setIsCreateOpen(false);
        setGalTitle('');
        setGalDesc('');
        setGalProjectId('');
        setGalClientId('');
      }
    } catch (err: any) {
      console.error('Failed to create proofing gallery:', err);
      setError(err.message || 'Gallery instantiation failed.');
    } finally {
      setSavingGal(false);
    }
  };

  const handleAddProofingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !itemImageUrl.trim() || !selectedGallery) return;

    try {
      setSavingItem(true);
      setError(null);

      const payload = {
        gallery_id: selectedGallery.id,
        title: itemTitle.trim(),
        description: itemDesc.trim() || null,
        image_url: itemImageUrl.trim(),
        status: 'pending',
        favorite_count: 0
      };

      const res = await apiFetch<ProofingItem>('/api/proofing_items', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.data) {
        const addedItem = Array.isArray(res.data) ? res.data[0] : res.data;
        setGalleryItems(prev => [...prev, addedItem]);
        setIsAddItemOpen(false);
        setItemTitle('');
        setItemDesc('');
        setItemImageUrl('');
      }
    } catch (err: any) {
      console.error('Failed to add proofing item:', err);
      setError(err.message || 'Proofing item insertion failed.');
    } finally {
      setSavingItem(false);
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
        <h3 className="text-xl font-bold text-black/80">Proofing Galleries</h3>
        {!selectedGallery && (
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#006663] text-white hover:bg-opacity-90 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus size={14} />
            Nieuwe Gallery Aanmaken
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Primary list of galleries */}
      {!selectedGallery ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map((gal) => {
            const client = users.find(u => u.id === gal.client_id);
            const project = projects.find(p => p.id === gal.project_id);
            const clientName = client?.full_name || client?.email || `Klant #${gal.client_id}`;
            const projName = project ? project.name : 'Geen project';

            return (
              <div 
                key={gal.id}
                className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 bg-black/5 text-black/50 border border-black/5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
                      {gal.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-black/30 font-semibold">
                      {format(new Date(gal.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-black/80 mb-1">{gal.title}</h4>
                  <p className="text-black/40 text-xs font-semibold leading-relaxed mb-6 line-clamp-2">
                    {gal.description || 'Geen galerij omschrijving.'}
                  </p>

                  <div className="border-t border-black/5 pt-4 space-y-2 mb-6">
                    <div className="flex justify-between text-[10px] font-bold text-black/40">
                      <span>Klant</span>
                      <span className="text-black/70 font-semibold">{clientName}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-black/40">
                      <span>Project</span>
                      <span className="text-black/70 font-semibold truncate max-w-[150px]">{projName}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleOpenGallery(gal)}
                  className="w-full py-2.5 bg-[#006663]/5 hover:bg-[#006663]/10 text-[#006663] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <FileImage size={14} />
                  Bekijk Ontwerpen
                </button>
              </div>
            );
          })}

          {galleries.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-black/5 text-center text-black/40 font-semibold">
              Er zijn nog geen proofing galleries aangemaakt.
            </div>
          )}
        </div>
      ) : (
        /* Expanded Gallery Concept View */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button 
                onClick={() => setSelectedGallery(null)}
                className="text-xs font-bold text-[#006663] hover:underline mb-2 block"
              >
                &larr; Terug naar Galleries
              </button>
              <h4 className="text-xl font-bold text-black/80">{selectedGallery.title}</h4>
              <p className="text-xs text-black/40 font-semibold mt-1">{selectedGallery.description}</p>
            </div>
            
            <button 
              onClick={() => setIsAddItemOpen(true)}
              className="bg-[#006663] text-white hover:bg-opacity-90 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-center shadow-sm"
            >
              <Plus size={14} />
              Concept Toevoegen
            </button>
          </div>

          {itemsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#006663]" size={30} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryItems.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="aspect-[4/3] bg-black/5 relative overflow-hidden group">
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1 shadow ${
                        item.status === 'approved' 
                          ? 'bg-green-500 text-white' 
                          : item.status === 'rejected' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white text-black/60'
                      }`}>
                        {item.status === 'approved' ? <ThumbsUp size={10} /> : item.status === 'rejected' ? <ThumbsDown size={10} /> : null}
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h5 className="font-bold text-black/80 text-base mb-1">{item.title}</h5>
                    <p className="text-black/40 text-xs font-semibold leading-relaxed mb-4 line-clamp-2">{item.description}</p>
                    
                    <div className="border-t border-black/5 pt-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-black/40 flex items-center gap-1">
                        <Star size={12} className="text-yellow-500 fill-yellow-500 animate-pulse" />
                        {item.favorite_count || 0} Favorieten
                      </span>
                      <a 
                        href={item.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-[#006663] flex items-center gap-1 hover:underline"
                      >
                        Bekijk Origineel
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}

              {galleryItems.length === 0 && (
                <div className="col-span-full bg-white p-12 rounded-3xl border border-black/5 text-center text-black/40 font-semibold">
                  Er zijn nog geen design concepten geüpload in deze galerij.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Gallery Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-6">
              <h4 className="font-bold text-lg text-black/80">Proofing Gallery Aanmaken</h4>
              <button onClick={() => setIsCreateOpen(false)} className="text-black/40 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateGallery} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Gallery Titel</label>
                <input 
                  type="text" 
                  required
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  placeholder="Bijv. Concept Ontwerpen Logo V2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Beschrijving</label>
                <textarea 
                  value={galDesc}
                  onChange={(e) => setGalDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all h-20 resize-none"
                  placeholder="Informatie voor de klant over deze ontwerpen..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Client</label>
                  <select 
                    required
                    value={galClientId}
                    onChange={(e) => setGalClientId(e.target.value)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  >
                    <option value="">Selecteer klant</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id.toString()}>{c.full_name || c.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Project (Optioneel)</label>
                  <select 
                    value={galProjectId}
                    onChange={(e) => setGalProjectId(e.target.value)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  >
                    <option value="">Selecteer project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-3 bg-black/5 hover:bg-black/10 text-black rounded-xl text-xs font-bold transition-all"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={savingGal}
                  className="flex-1 py-3 bg-[#006663] text-white hover:bg-opacity-90 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  {savingGal && <Loader2 className="animate-spin" size={14} />}
                  Instantiëren
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Proofing Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddItemOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-6">
              <h4 className="font-bold text-lg text-black/80">Concept Toevoegen</h4>
              <button onClick={() => setIsAddItemOpen(false)} className="text-black/40 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProofingItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Concept Titel</label>
                <input 
                  type="text" 
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  placeholder="Bijv. Herfst Banner Concept A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Ontwerp Omschrijving</label>
                <textarea 
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all h-20 resize-none"
                  placeholder="Geef uitleg over de kleuren, stijl of typography keuzes..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Afbeelding URL</label>
                <input 
                  type="url" 
                  required
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  placeholder="https://picsum.photos/800/600 (Gebruik mock URL)"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="flex-1 py-3 bg-black/5 hover:bg-black/10 text-black rounded-xl text-xs font-bold transition-all"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="flex-1 py-3 bg-[#006663] text-white hover:bg-opacity-90 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  {savingItem && <Loader2 className="animate-spin" size={14} />}
                  Concept Uploaden
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
