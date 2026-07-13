import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Image as ImageIcon, 
  CheckCircle, 
  XCircle, 
  Star, 
  MessageSquare, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  ThumbsUp,
  RotateCcw,
  Eye,
  Send
} from 'lucide-react';
import { format } from 'date-fns';

interface Gallery {
  id: string;
  title: string;
  project_id: string | null;
  client_id: number;
  status: string; // pending_review, approved, rejected
  created_at: string;
}

interface ProofingItem {
  id: string;
  gallery_id: string;
  file_name: string;
  file_url: string;
  client_selected: boolean;
  favorite_count: number;
  status: string; // pending, approved, rejected
  created_at: string;
}

// Simple local comment interface for interactive simulation
interface Comment {
  itemId: string;
  sender: string;
  text: string;
  time: Date;
}

export const ClientProofingGallery: React.FC = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [items, setItems] = useState<ProofingItem[]>([]);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active review item
  const [activeReviewItem, setActiveReviewItem] = useState<ProofingItem | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [actioningItem, setActioningItem] = useState(false);

  // Local interactive comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<Gallery[]>('/api/proofing_galleries');
      setGalleries(res.data || []);
    } catch (err) {
      console.error('Failed to fetch proofing galleries:', err);
      setError('Could not load proofing galleries.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGallery = async (gallery: Gallery) => {
    setSelectedGallery(gallery);
    setLoadingItems(true);
    try {
      const res = await apiFetch<ProofingItem[]>(`/api/proofing_items?gallery_id=${gallery.id}`);
      setItems(res.data || []);
      if (res.data && res.data.length > 0) {
        setActiveReviewItem(res.data[0]);
      } else {
        setActiveReviewItem(null);
      }
    } catch (err) {
      console.error('Failed to fetch proofing items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleToggleFavorite = async (item: ProofingItem) => {
    const isFav = item.favorite_count > 0;
    const nextCount = isFav ? 0 : 1;

    try {
      const res = await apiFetch<ProofingItem>(`/api/proofing_items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ favorite_count: nextCount })
      });

      if (res.data) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, favorite_count: nextCount } : i));
        if (activeReviewItem?.id === item.id) {
          setActiveReviewItem(prev => prev ? { ...prev, favorite_count: nextCount } : null);
        }
      }
    } catch (err) {
      console.error('Failed to toggle favorite status:', err);
    }
  };

  const handleToggleSelect = async (item: ProofingItem) => {
    const nextSelect = !item.client_selected;

    try {
      const res = await apiFetch<ProofingItem>(`/api/proofing_items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ client_selected: nextSelect })
      });

      if (res.data) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, client_selected: nextSelect } : i));
        if (activeReviewItem?.id === item.id) {
          setActiveReviewItem(prev => prev ? { ...prev, client_selected: nextSelect } : null);
        }
      }
    } catch (err) {
      console.error('Failed to toggle select status:', err);
    }
  };

  const handleApproveItem = async (item: ProofingItem) => {
    try {
      setActioningItem(true);
      const res = await apiFetch<ProofingItem>(`/api/proofing_items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' })
      });

      if (res.data) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'approved' } : i));
        setActiveReviewItem(prev => prev ? { ...prev, status: 'approved' } : null);
      }
    } catch (err) {
      console.error('Failed to approve concept:', err);
    } finally {
      setActioningItem(false);
    }
  };

  const handleRejectItem = async (item: ProofingItem) => {
    if (!revisionFeedback.trim()) return;
    try {
      setActioningItem(true);
      const res = await apiFetch<ProofingItem>(`/api/proofing_items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: 'rejected',
          // Append feedback to comment stream as well
        })
      });

      if (res.data) {
        // Log the feedback as an interactive comment
        setComments(prev => [...prev, {
          itemId: item.id,
          sender: 'Klant (Revisie)',
          text: revisionFeedback.trim(),
          time: new Date()
        }]);

        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'rejected' } : i));
        setActiveReviewItem(prev => prev ? { ...prev, status: 'rejected' } : null);
        setRevisionFeedback('');
      }
    } catch (err) {
      console.error('Failed to request revision:', err);
    } finally {
      setActioningItem(false);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeReviewItem) return;

    setComments(prev => [...prev, {
      itemId: activeReviewItem.id,
      sender: 'Klant',
      text: newCommentText.trim(),
      time: new Date()
    }]);

    setNewCommentText('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#006663]" size={40} />
      </div>
    );
  }

  if (selectedGallery) {
    const activeItemComments = comments.filter(c => c.itemId === activeReviewItem?.id);

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Back header */}
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <button 
            onClick={() => {
              setSelectedGallery(null);
              setItems([]);
              setActiveReviewItem(null);
            }}
            className="flex items-center gap-2 px-4 py-2 hover:bg-black/5 rounded-xl font-bold text-sm text-black/60 transition-all"
          >
            <ArrowLeft size={16} /> Terug naar Proofing overzicht
          </button>
          
          <span className="font-extrabold text-sm text-black/80">{selectedGallery.title}</span>
        </div>

        {loadingItems ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[#006663]" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-black/5 text-center">
            <ImageIcon size={32} className="text-black/10 mx-auto mb-2" />
            <p className="text-xs font-bold text-black/40">Geen concepten geüpload</p>
            <p className="text-[10px] text-black/30 mt-0.5">De ontwerper is momenteel bezig met het toevoegen van ontwerpen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left thumbnails sidebar */}
            <div className="lg:col-span-1 space-y-4 text-left">
              <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 px-2">Concepten ({items.length})</h4>
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                {items.map((item, index) => {
                  const isActive = activeReviewItem?.id === item.id;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => setActiveReviewItem(item)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                        isActive 
                          ? 'bg-[#006663]/5 border-[#006663]/20 shadow-sm' 
                          : 'bg-white border-black/5 hover:border-black/10 hover:shadow-sm'
                      }`}
                    >
                      <div className="w-12 h-12 bg-black/5 rounded-xl overflow-hidden flex-shrink-0 relative">
                        <img 
                          src={item.file_url} 
                          alt={item.file_name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-black/80">Concept #{index + 1}</p>
                        <p className="text-[10px] text-black/40 truncate font-semibold mt-0.5">{item.file_name}</p>
                        
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase border ${
                            item.status === 'approved' 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : item.status === 'rejected'
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }`}>
                            {item.status}
                          </span>
                          {item.client_selected && (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#ffd833]/15 text-yellow-700 border border-yellow-200 uppercase">
                              Gekozen
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Middle Main Preview Panel */}
            <div className="lg:col-span-2 space-y-6">
              {activeReviewItem && (
                <div className="bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-black/80">{activeReviewItem.file_name}</h3>
                      <p className="text-xs font-semibold text-black/40 mt-0.5">
                        Geüpload op {format(new Date(activeReviewItem.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleToggleFavorite(activeReviewItem)}
                        className={`p-2.5 rounded-xl border transition-all ${
                          activeReviewItem.favorite_count > 0 
                            ? 'bg-[#ffd833]/10 border-yellow-300 text-yellow-500' 
                            : 'border-black/5 text-black/20 hover:text-black/40'
                        }`}
                        title="Favoriet"
                      >
                        <Star size={16} fill={activeReviewItem.favorite_count > 0 ? 'currentColor' : 'none'} />
                      </button>

                      <button 
                        onClick={() => handleToggleSelect(activeReviewItem)}
                        className={`p-2.5 rounded-xl border transition-all ${
                          activeReviewItem.client_selected 
                            ? 'bg-green-50 border-green-200 text-green-600' 
                            : 'border-black/5 text-black/20 hover:text-black/40'
                        }`}
                        title="Selecteer dit concept"
                      >
                        <ThumbsUp size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Main Large preview */}
                  <div className="w-full h-80 bg-black/[0.02] border border-black/5 rounded-3xl overflow-hidden relative flex items-center justify-center">
                    <img 
                      src={activeReviewItem.file_url} 
                      alt={activeReviewItem.file_name} 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <a 
                      href={activeReviewItem.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 bg-white/80 hover:bg-white p-2 rounded-lg text-black/60 hover:text-black transition-all flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Eye size={12} /> Open origineel
                    </a>
                  </div>

                  {/* Approve / Reject Actions */}
                  <div className="p-6 bg-black/5 rounded-3xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-black/40">Review Acties</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleApproveItem(activeReviewItem)}
                        disabled={actioningItem || activeReviewItem.status === 'approved'}
                        className="py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-green-600/15"
                      >
                        <CheckCircle size={14} /> Keur Concept Goed
                      </button>

                      <button
                        onClick={() => document.getElementById('revision-input-field')?.focus()}
                        disabled={actioningItem}
                        className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/15"
                      >
                        <RotateCcw size={14} /> Vraag Revisie Aan
                      </button>
                    </div>

                    {/* Revision Feedback box */}
                    <div className="pt-3 border-t border-black/5">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1.5">
                        Revisie Feedback (Vereist bij revisie aanvraag)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          id="revision-input-field"
                          placeholder="Bijv. Maak de titels iets groter en gebruik meer witruimte..."
                          value={revisionFeedback}
                          onChange={(e) => setRevisionFeedback(e.target.value)}
                          className="flex-1 px-4 py-3 bg-white rounded-xl outline-none font-semibold text-xs border border-black/5 focus:border-black/10 transition-all"
                        />
                        <button
                          onClick={() => handleRejectItem(activeReviewItem)}
                          disabled={actioningItem || !revisionFeedback.trim()}
                          className="px-4 py-3 bg-black text-white hover:bg-black/80 rounded-xl text-xs font-bold transition-all disabled:opacity-30 shrink-0"
                        >
                          Dien In
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Feedback and Comments */}
            <div className="lg:col-span-1 bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-sm flex flex-col h-[520px] relative text-left">
              <h3 className="font-bold text-lg text-black/80 flex items-center gap-2 mb-4">
                <MessageSquare size={18} className="text-[#006663]" />
                Concept Overleg
              </h3>

              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin scrollbar-thumb-gray-200">
                  {activeItemComments.map((comment, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-black/40">
                        <span>{comment.sender}</span>
                        <span>{format(comment.time, 'h:mm a')}</span>
                      </div>
                      <div className="p-3 bg-black/5 rounded-2xl text-xs font-semibold text-black/70">
                        {comment.text}
                      </div>
                    </div>
                  ))}
                  {activeItemComments.length === 0 && (
                    <div className="text-center text-black/30 text-xs py-12 font-semibold">
                      Geen opmerkingen over dit concept. Type hieronder om feedback achter te laten.
                    </div>
                  )}
                </div>

                <form onSubmit={handlePostComment} className="flex gap-2 border-t border-black/5 pt-3">
                  <input 
                    type="text" 
                    placeholder="Laat een reactie achter..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 px-4 py-3 bg-black/5 border border-transparent rounded-xl outline-none text-xs font-semibold focus:bg-white focus:border-black/10 transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!newCommentText.trim()}
                    className="w-10 h-10 bg-[#006663] text-white hover:bg-opacity-90 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-black/80">Proofing Galleries</h3>
      </div>

      {galleries.length === 0 ? (
        <div className="p-12 bg-white rounded-[2.5rem] border border-black/5 shadow-sm text-center">
          <ImageIcon size={36} className="text-black/10 mx-auto mb-3" />
          <h4 className="font-bold text-lg text-black/60">Geen actieve proofing sessies</h4>
          <p className="text-sm text-black/40 mt-1 max-w-sm mx-auto">
            Zodra ontwerpen klaar zijn voor beoordeling, uploadt uw ontwerper hier een Proofing Gallery voor uw goedkeuring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map((gallery) => (
            <div 
              key={gallery.id}
              onClick={() => handleSelectGallery(gallery)}
              className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between min-h-[160px] text-left"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                    gallery.status === 'approved' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}>
                    {gallery.status.replace('_', ' ')}
                  </span>
                  <ChevronRight size={16} className="text-black/20" />
                </div>
                <h4 className="font-bold text-base text-black/80 line-clamp-2">{gallery.title}</h4>
              </div>

              <div className="border-t border-black/5 pt-4 mt-4 text-black/50 text-[10px] font-bold uppercase tracking-wider">
                Geüpload: {format(new Date(gallery.created_at), 'MMM d, yyyy')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
