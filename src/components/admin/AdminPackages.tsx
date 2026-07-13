import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Briefcase, 
  DollarSign, 
  CheckCircle, 
  Edit, 
  Plus, 
  Loader2, 
  AlertCircle,
  X,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

interface Package {
  id: number;
  name: string;
  description: string | null;
  price: number; // in cents
  request_limit: number;
  revision_limit: number;
  support_tier: string;
}

export const AdminPackages: React.FC = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit/create state
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState(0); // in USD
  const [editRequestLimit, setEditRequestLimit] = useState(0);
  const [editRevisionLimit, setEditRevisionLimit] = useState(0);
  const [editSupportTier, setEditSupportTier] = useState('standard');
  const [saving, setSaving] = useState(false);

  // Super admin check
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<Package[]>('/api/packages');
      setPackages(res.data || []);
    } catch (err) {
      console.error('Failed to load packages:', err);
      setError('Could not fetch packages.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setEditName(pkg.name);
    setEditDesc(pkg.description || '');
    setEditPrice(pkg.price / 100);
    setEditRequestLimit(pkg.request_limit);
    setEditRevisionLimit(pkg.revision_limit);
    setEditSupportTier(pkg.support_tier);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    if (!isSuperAdmin) {
      setError('Alleen Super Admins kunnen packages aanpassen.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: editName.trim(),
        description: editDesc.trim(),
        price: Math.round(editPrice * 100), // convert to cents
        request_limit: Number(editRequestLimit),
        revision_limit: Number(editRevisionLimit),
        support_tier: editSupportTier
      };

      const res = await apiFetch<Package>(`/api/packages/${editingPackage.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.data) {
        setPackages(prev => prev.map(p => p.id === editingPackage.id ? { ...p, ...payload } : p));
        setEditingPackage(null);
      }
    } catch (err: any) {
      console.error('Failed to save package edit:', err);
      setError(err.message || 'Saving package failed.');
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-black/80">Packages Beheren</h3>
          <p className="text-xs text-black/40 font-medium mt-1">
            {isSuperAdmin ? 'U hebt Super Admin rechten om abonnementen aan te passen.' : 'Bekijk actieve abonnementsvormen. Aanpassen vereist Super Admin rechten.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-[#006663]/5 text-[#006663] rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                  {pkg.support_tier}
                </span>
                {isSuperAdmin && (
                  <button 
                    onClick={() => handleOpenEdit(pkg)}
                    className="p-2 hover:bg-black/5 rounded-xl text-[#006663] transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                )}
              </div>

              <h4 className="text-xl font-bold text-black/80 mb-2">{pkg.name}</h4>
              <p className="text-black/40 text-xs font-medium mb-6 min-h-[3rem]">{pkg.description || 'Geen beschrijving'}</p>

              <div className="border-t border-black/5 pt-6 space-y-3 mb-8">
                <div className="flex justify-between text-xs font-semibold text-black/60">
                  <span>Aantal Aanvragen / m</span>
                  <span className="font-bold text-black/80">{pkg.request_limit === 9999 ? 'Onbeperkt' : pkg.request_limit}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-black/60">
                  <span>Revisie Limiet</span>
                  <span className="font-bold text-black/80">{pkg.revision_limit === 9999 ? 'Onbeperkt' : pkg.revision_limit}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-black/60">
                  <span>Support Tier</span>
                  <span className="font-bold text-black/80 capitalize">{pkg.support_tier}</span>
                </div>
              </div>
            </div>

            {/* Price section */}
            <div className="border-t border-black/5 pt-6">
              <p className="text-3xl font-extrabold text-black/80">
                ${(pkg.price / 100).toFixed(2)} USD
                <span className="text-xs text-black/40 font-bold uppercase tracking-wider ml-1">/ maand</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Package Modal */}
      {editingPackage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingPackage(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-6">
              <h4 className="font-bold text-lg text-black/80">Package Wijzigen</h4>
              <button onClick={() => setEditingPackage(null)} className="text-black/40 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Package Naam</label>
                <input 
                  type="text" 
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Beschrijving</label>
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Prijs ($ / m)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Support Tier</label>
                  <select 
                    value={editSupportTier}
                    onChange={(e) => setEditSupportTier(e.target.value)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  >
                    <option value="standard">Standard</option>
                    <option value="priority">Priority</option>
                    <option value="dedicated">Dedicated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Request Limiet</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max="9999"
                    value={editRequestLimit}
                    onChange={(e) => setEditRequestLimit(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Revisie Limiet</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max="9999"
                    value={editRevisionLimit}
                    onChange={(e) => setEditRevisionLimit(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
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
