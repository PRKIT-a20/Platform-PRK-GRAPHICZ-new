import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Loader2, 
  AlertCircle, 
  MessageSquare, 
  CheckCircle2, 
  Send,
  Target,
  Users,
  Compass,
  LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface StrategyBoard {
  id: string;
  title: string;
  project_name: string;
  goals: string;
  target_audience: string;
  positioning: string;
  creative_direction: string;
  feedback: { client_name: string; text: string; created_at: string }[];
  moodboard: { id: string; image_url: string; title: string }[];
}

export const StrategyBoard: React.FC = () => {
  const [board, setBoard] = useState<StrategyBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFeedback, setNewFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBoard();
  }, []);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<StrategyBoard[]>('/api/strategy_boards');
      if (res.data && res.data.length > 0) {
        setBoard(res.data[0]);
      } else {
        setError('No strategy board found for this client.');
      }
    } catch (err) {
      setError('Failed to load strategy board.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.trim() || !board) return;
    
    try {
      setSubmitting(true);
      await apiFetch(`/api/strategy_boards/${board.id}/feedback`, {
        method: 'PATCH',
        body: JSON.stringify({ feedback: newFeedback })
      });
      setNewFeedback('');
      await fetchBoard();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  if (error) return <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100">{error}</div>;
  if (!board) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">{board.title}</h2>
          <div className="space-y-4">
            {[
              { icon: Target, label: 'Goals', value: board.goals },
              { icon: Users, label: 'Target Audience', value: board.target_audience },
              { icon: Compass, label: 'Positioning', value: board.positioning },
              { icon: LayoutGrid, label: 'Creative Direction', value: board.creative_direction },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="p-3 bg-brand-primary/5 rounded-xl h-fit"><item.icon className="text-brand-primary" size={20} /></div>
                <div>
                  <h4 className="font-bold text-sm text-black/60">{item.label}</h4>
                  <p className="text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm flex flex-col">
          <h3 className="font-bold text-lg mb-6">Strategy Feedback</h3>
          <div className="flex-1 space-y-4 overflow-y-auto mb-6">
            {board.feedback.map((f, i) => (
              <div key={i} className="p-4 bg-black/[0.02] rounded-2xl text-sm">
                <p className="font-bold text-xs mb-1">{f.client_name} • {format(new Date(f.created_at), 'MMM d, HH:mm')}</p>
                <p className="text-black/70">{f.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleFeedbackSubmit} className="relative">
            <textarea 
              value={newFeedback} 
              onChange={e => setNewFeedback(e.target.value)}
              className="w-full p-4 bg-black/5 rounded-2xl text-sm outline-none resize-none focus:bg-white focus:border-brand-primary border border-transparent transition-all"
              placeholder="Leave feedback on the strategy..."
              rows={3}
            />
            <button 
              disabled={submitting}
              className="absolute bottom-4 right-4 p-2 bg-brand-primary text-white rounded-xl hover:bg-opacity-90 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Moodboard */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
        <h3 className="font-bold text-lg mb-6">Moodboard</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {board.moodboard.map(item => (
            <motion.div key={item.id} whileHover={{ scale: 1.02 }} className="rounded-2xl overflow-hidden shadow-sm">
              <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
