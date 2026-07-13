import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Target, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertTriangle, 
  X, 
  CheckCircle, 
  FileText,
  User,
  Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface StrategyBoard {
  id: string;
  client_id: number;
  brand_positioning: string | null;
  target_audience: string | null;
  core_pillars: string | null; // Content pillars
  feedback: string | null;
  created_at: string;
}

interface UserRecord {
  id: number;
  email: string;
  full_name: string | null;
}

export const AdminStrategy: React.FC = () => {
  const [boards, setBoards] = useState<StrategyBoard[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<StrategyBoard | null>(null);

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [brandPositioning, setBrandPositioning] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [corePillars, setCorePillars] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBoardsAndUsers();
  }, []);

  const fetchBoardsAndUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [boardRes, usersRes] = await Promise.all([
        apiFetch<StrategyBoard[]>('/api/strategy_boards'),
        apiFetch<UserRecord[]>('/api/users')
      ]);

      setBoards(boardRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Failed to load strategy boards:', err);
      setError('Could not load brand strategy board directories.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        client_id: Number(clientId),
        brand_positioning: brandPositioning.trim() || null,
        target_audience: targetAudience.trim() || null,
        core_pillars: corePillars.trim() || null,
        feedback: null
      };

      const res = await apiFetch<StrategyBoard[]>('/api/strategy_boards', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.data) {
        const addedBoard = Array.isArray(res.data) ? res.data[0] : res.data;
        setBoards(prev => [addedBoard, ...prev]);
        setIsCreateOpen(false);
        // Reset
        setClientId('');
        setBrandPositioning('');
        setTargetAudience('');
        setCorePillars('');
      }
    } catch (err: any) {
      console.error('Failed to instantiate strategy board:', err);
      setError(err.message || 'Strategy board creation failed.');
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
        <h3 className="text-xl font-bold text-black/80">Strategy Board Manager</h3>
        {!selectedBoard && (
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#006663] text-white hover:bg-opacity-90 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus size={14} />
            Nieuw Strategy Board
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Primary list of Strategy Boards */}
      {!selectedBoard ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => {
            const client = users.find(u => u.id === board.client_id);
            const clientName = client?.full_name || client?.email || `Klant #${board.client_id}`;

            return (
              <div 
                key={board.id}
                className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 bg-[#006663]/5 text-[#006663] rounded-2xl flex items-center justify-center mb-4">
                    <Target size={18} />
                  </div>

                  <h4 className="text-base font-bold text-black/80 mb-1">Strategy Board: {clientName}</h4>
                  <p className="text-[10px] text-black/30 font-bold uppercase tracking-widest mb-6">
                    Aangemaakt op {format(new Date(board.created_at), 'MMM d, yyyy')}
                  </p>

                  <div className="border-t border-black/5 pt-4 space-y-3 mb-6 font-semibold text-xs text-black/60">
                    <div className="truncate">
                      <span className="text-[9px] font-bold text-black/40 block uppercase tracking-wider">Positionering</span>
                      <span className="text-black/80 font-bold mt-0.5 block truncate">{board.brand_positioning || 'Geen'}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-[9px] font-bold text-black/40 block uppercase tracking-wider">Doelgroep</span>
                      <span className="text-black/80 font-bold mt-0.5 block truncate">{board.target_audience || 'Geen'}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedBoard(board)}
                  className="w-full py-2.5 bg-[#006663]/5 hover:bg-[#006663]/10 text-[#006663] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <FileText size={14} />
                  Zichtbaarheid & Feedback
                </button>
              </div>
            );
          })}

          {boards.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-black/5 text-center text-black/40 font-semibold">
              Er zijn nog geen strategy boards geconfigureerd.
            </div>
          )}
        </div>
      ) : (
        /* Detailed View & Client Feedback Monitor */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex items-center justify-between">
            <div>
              <button 
                onClick={() => setSelectedBoard(null)}
                className="text-xs font-bold text-[#006663] hover:underline mb-2 block"
              >
                &larr; Terug naar Strategy Boards
              </button>
              <h4 className="text-lg font-bold text-black/80">
                Strategy Board: {users.find(u => u.id === selectedBoard.client_id)?.full_name || 'Klant'}
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Board fields card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Brand Position */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                <h5 className="font-bold text-xs uppercase tracking-widest text-black/40 mb-3">Positionering & Visie</h5>
                <p className="text-sm text-black/70 font-semibold leading-relaxed whitespace-pre-wrap">
                  {selectedBoard.brand_positioning || 'Geen visie geformuleerd.'}
                </p>
              </div>

              {/* Target Audience */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                <h5 className="font-bold text-xs uppercase tracking-widest text-black/40 mb-3">Doelgroep Profiel</h5>
                <p className="text-sm text-black/70 font-semibold leading-relaxed whitespace-pre-wrap">
                  {selectedBoard.target_audience || 'Geen doelgroep gedefinieerd.'}
                </p>
              </div>

              {/* Content Pillars */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                <h5 className="font-bold text-xs uppercase tracking-widest text-black/40 mb-3">Inhoudelijke Content Pillars</h5>
                <p className="text-sm text-black/70 font-semibold leading-relaxed whitespace-pre-wrap">
                  {selectedBoard.core_pillars || 'Geen content pilaren ingesteld.'}
                </p>
              </div>
            </div>

            {/* Feedback Loops side-panel */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-6 self-start">
              <h5 className="font-bold text-xs uppercase tracking-widest text-black/40 border-b border-black/5 pb-3 flex items-center gap-1.5">
                <Heart size={14} className="text-red-500 fill-red-500" />
                Feedback van Klant
              </h5>

              {selectedBoard.feedback ? (
                <div className="p-4 bg-green-50/50 border border-green-100 rounded-2xl text-xs font-semibold leading-relaxed text-black/80">
                  <p className="whitespace-pre-wrap">{selectedBoard.feedback}</p>
                </div>
              ) : (
                <p className="text-xs text-black/30 font-medium italic">De klant heeft nog geen feedback achtergelaten op deze editie.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Board Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-6">
              <h4 className="font-bold text-lg text-black/80">Nieuw Strategy Board</h4>
              <button onClick={() => setIsCreateOpen(false)} className="text-black/40 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Klant Koppelen</label>
                <select 
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                >
                  <option value="">Kies klant...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.full_name || c.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Positionering & Visie</label>
                <textarea 
                  value={brandPositioning}
                  onChange={(e) => setBrandPositioning(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all h-20 resize-none"
                  placeholder="Merkvisie, positionering, toon..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Doelgroep Profiel</label>
                <textarea 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all h-20 resize-none"
                  placeholder="Bijv. Millennial professionals, age 25-35..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Content Pilaren (JSON / Tekst)</label>
                <textarea 
                  value={corePillars}
                  onChange={(e) => setCorePillars(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all h-20 resize-none"
                  placeholder="Bijv: 1. Educatief, 2. Lifestyle, 3. Product Features..."
                />
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
                  disabled={saving}
                  className="flex-1 py-3 bg-[#006663] text-white hover:bg-opacity-90 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  {saving && <Loader2 className="animate-spin" size={14} />}
                  Opslaan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
