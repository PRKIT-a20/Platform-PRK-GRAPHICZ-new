import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Compass, 
  Target, 
  Users, 
  Palette, 
  MessageSquare, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Send,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface StrategyBoard {
  id: string;
  client_id: number;
  project_id: string | null;
  title: string;
  goals: string | null;
  target_audience: string | null;
  brand_direction: string | null;
  moodboards: string | null; // comma separated image URLs or descriptions
  feedback: string | null;
  created_at: string;
}

export const ClientStrategyBoard: React.FC = () => {
  const [boards, setBoards] = useState<StrategyBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<StrategyBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback states
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<StrategyBoard[]>('/api/strategy_boards');
      setBoards(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedBoard(res.data[0]);
        setFeedbackText(res.data[0].feedback || '');
      }
    } catch (err) {
      console.error('Failed to fetch strategy boards:', err);
      setError('Could not load brand strategy board.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBoard = (board: StrategyBoard) => {
    setSelectedBoard(board);
    setFeedbackText(board.feedback || '');
    setFeedbackSuccess(false);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoard || !feedbackText.trim()) return;

    try {
      setSubmittingFeedback(true);
      setFeedbackSuccess(false);
      
      const res = await apiFetch<StrategyBoard>(`/api/strategy_boards/${selectedBoard.id}`, {
        method: 'PUT',
        body: JSON.stringify({ feedback: feedbackText.trim() })
      });

      if (res.data) {
        setFeedbackSuccess(true);
        setSelectedBoard(res.data);
        setBoards(prev => prev.map(b => b.id === selectedBoard.id ? res.data : b));
      }
    } catch (err) {
      console.error('Could not save strategy feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#006663]" size={40} />
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="p-12 bg-white rounded-[2.5rem] border border-black/5 shadow-sm text-center">
        <Compass size={36} className="text-black/10 mx-auto mb-3" />
        <h4 className="font-bold text-lg text-black/60">Geen actieve Strategy Boards</h4>
        <p className="text-sm text-black/40 mt-1 max-w-sm mx-auto">
          Zodra uw merkdoelstellingen en doelgroepprofielen zijn geanalyseerd, uploadt de strateeg hier een Strategy Board.
        </p>
      </div>
    );
  }

  // Parse moodboard images (handles comma separated string of URLs)
  const moodboardUrls = selectedBoard?.moodboards
    ? selectedBoard.moodboards.split(',').map(url => url.trim()).filter(url => url.startsWith('http'))
    : [];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Selector bar if they have multiple boards */}
      {boards.length > 1 && (
        <div className="flex gap-2 bg-black/5 p-1 rounded-xl w-fit">
          {boards.map((board, idx) => (
            <button 
              key={board.id}
              onClick={() => handleSelectBoard(board)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedBoard?.id === board.id ? 'bg-[#006663] text-white' : 'text-black/40 hover:text-black/60'
              }`}
            >
              Strategy Board {idx + 1}: {board.title}
            </button>
          ))}
        </div>
      )}

      {selectedBoard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Board Canvas */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest w-fit mb-3">
                  <Sparkles size={12} />
                  Brand Identity Direction
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{selectedBoard.title}</h2>
                <p className="text-white/50 text-xs mt-1">
                  Established on {format(new Date(selectedBoard.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <Compass size={40} className="text-white/10 shrink-0" />
            </div>

            {/* Bento Grid strategy panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Doelen */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-3">
                <div className="w-10 h-10 bg-[#006663]/5 text-[#006663] rounded-xl flex items-center justify-center">
                  <Target size={18} />
                </div>
                <h3 className="font-extrabold text-base text-black/80">Merk Doelen (Goals)</h3>
                <p className="text-xs text-black/60 leading-relaxed font-semibold whitespace-pre-line">
                  {selectedBoard.goals || 'Niet ingevoerd.'}
                </p>
              </div>

              {/* Doelgroep */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-3">
                <div className="w-10 h-10 bg-[#ffd833]/15 text-yellow-600 rounded-xl flex items-center justify-center">
                  <Users size={18} />
                </div>
                <h3 className="font-extrabold text-base text-black/80">Doelgroep (Target Audience)</h3>
                <p className="text-xs text-black/60 leading-relaxed font-semibold whitespace-pre-line">
                  {selectedBoard.target_audience || 'Niet ingevoerd.'}
                </p>
              </div>

              {/* Merkrichting */}
              <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                    <Palette size={18} />
                  </div>
                  <h3 className="font-extrabold text-lg text-black/80">Merkrichting & Visuele Stijl</h3>
                </div>
                <p className="text-sm text-black/60 leading-relaxed font-medium whitespace-pre-line">
                  {selectedBoard.brand_direction || 'Niet ingevoerd.'}
                </p>
              </div>
            </div>

            {/* Moodboards */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6">
              <h3 className="font-extrabold text-lg text-black/80 flex items-center gap-2">
                <Palette size={20} className="text-[#006663]" />
                Moodboards & Kleurenwaaier
              </h3>
              
              {moodboardUrls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {moodboardUrls.map((url, idx) => (
                    <div key={idx} className="aspect-video bg-black/5 rounded-2xl overflow-hidden relative group border border-black/5 shadow-sm">
                      <img 
                        src={url} 
                        alt={`Moodboard ${idx + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all"
                        referrerPolicy="no-referrer"
                      />
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 p-1.5 bg-white/80 rounded hover:bg-white text-black/60 hover:text-black transition-all"
                      >
                        <Eye size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : selectedBoard.moodboards ? (
                <div className="p-4 bg-black/5 rounded-2xl border border-black/5 font-semibold text-xs text-black/60 leading-relaxed">
                  {selectedBoard.moodboards}
                </div>
              ) : (
                <div className="py-8 text-center text-black/30 text-xs font-semibold">
                  Geen moodboards geüpload voor dit strategy board.
                </div>
              )}
            </div>
          </div>

          {/* Feedback Drawer (Persists in PostgreSQL via PUT) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6 flex flex-col justify-between min-h-[420px]">
            <div>
              <h3 className="font-extrabold text-lg text-black/80 flex items-center gap-2 mb-2">
                <MessageSquare size={18} className="text-[#006663]" />
                Klant Feedback
              </h3>
              <p className="text-xs text-black/40 font-semibold leading-relaxed">
                Geef uw opmerkingen of goedkeuring door over deze merkrichting. Onze strategen verwerken deze direct.
              </p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="flex-1 flex flex-col justify-between pt-4 space-y-4">
              <textarea 
                rows={6}
                required
                placeholder="Bijv. We vinden het kleurenpallet erg mooi, maar willen graag dat het logo een professionelere, strakke uitstraling krijgt..."
                value={feedbackText}
                onChange={(e) => {
                  setFeedbackText(e.target.value);
                  setFeedbackSuccess(false);
                }}
                className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none text-xs font-semibold focus:bg-white focus:border-black/10 transition-all resize-none flex-1"
              />

              {feedbackSuccess && (
                <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-bold">
                  Feedback succesvol opgeslagen!
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={submittingFeedback || !feedbackText.trim()}
                className="w-full py-4 bg-[#006663] hover:bg-opacity-90 disabled:opacity-50 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-[#006663]/15 shrink-0"
              >
                {submittingFeedback ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                Feedback Verzenden
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
