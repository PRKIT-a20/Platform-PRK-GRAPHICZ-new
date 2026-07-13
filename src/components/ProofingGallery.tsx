import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  Loader2, 
  AlertCircle, 
  MessageSquare, 
  CheckCircle2, 
  RefreshCw, 
  Heart,
  ChevronRight,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface ProofingGallery {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

interface ProofingItem {
  id: string;
  title: string;
  image_url: string;
  version: number;
  status: 'pending_review' | 'approved' | 'revision_requested';
  created_at: string;
}

interface Comment {
  id: string;
  comment: string;
  client_name: string;
  created_at: string;
}

export const ProofingGallery: React.FC = () => {
  const { user } = useAuth();
  const [galleries, setGalleries] = useState<ProofingGallery[]>([]);
  const [activeGallery, setActiveGallery] = useState<ProofingGallery | null>(null);
  const [items, setItems] = useState<ProofingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ProofingItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGalleries();
  }, [user]);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<ProofingGallery[]>('/api/proofing_galleries');
      setGalleries(res.data || []);
    } catch (err) {
      setError('Failed to load galleries.');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (galleryId: string) => {
    try {
      setLoadingItems(true);
      const res = await apiFetch<ProofingItem[]>(`/api/proofing_items/${galleryId}`);
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleStatusUpdate = async (itemId: string, status: 'approved' | 'revision_requested') => {
    try {
      await apiFetch(`/api/proofing_items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await fetchItems(activeGallery!.id);
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedItem) return;
    try {
      await apiFetch('/api/proofing_comments', {
        method: 'POST',
        body: JSON.stringify({ proofing_item_id: selectedItem.id, comment: newComment })
      });
      setNewComment('');
      // Refresh comments if needed
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div className="space-y-6">
      {!activeGallery ? (
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Proofing Galleries</h2>
          <div className="grid gap-4">
            {galleries.map(g => (
              <button key={g.id} onClick={() => { setActiveGallery(g); fetchItems(g.id); }} className="p-6 bg-black/[0.02] hover:bg-black/[0.04] rounded-2xl flex justify-between items-center transition-all">
                <span className="font-bold">{g.name}</span>
                <ChevronRight className="text-black/40" />
              </button>
            ))}
          </div>
        </div>
      ) : !selectedItem ? (
        <div className="space-y-6">
          <button onClick={() => setActiveGallery(null)} className="text-sm font-bold text-brand-primary">← Back to Galleries</button>
          <h2 className="text-2xl font-bold">{activeGallery.name}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedItem(item)}>
                <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover rounded-xl mb-4" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{item.title}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${item.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>{item.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setSelectedItem(null)} className="text-sm font-bold text-brand-primary">← Back to Gallery</button>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-black/5 rounded-3xl p-4">
              <img src={selectedItem.image_url} alt={selectedItem.title} className="w-full rounded-2xl" />
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
              <h3 className="text-xl font-bold mb-4">{selectedItem.title}</h3>
              <div className="flex gap-2 mb-6">
                <button onClick={() => handleStatusUpdate(selectedItem.id, 'approved')} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700">Approve</button>
                <button onClick={() => handleStatusUpdate(selectedItem.id, 'revision_requested')} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700">Request Revision</button>
              </div>
              <form onSubmit={addComment}>
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} className="w-full p-4 bg-black/5 rounded-xl mb-2 text-sm" placeholder="Leave feedback..." />
                <button className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold text-sm">Post Comment</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
