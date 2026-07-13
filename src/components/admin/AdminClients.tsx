import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Shield, 
  CheckCircle, 
  Clock, 
  Edit, 
  Loader2, 
  AlertCircle,
  MoreVertical,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface ClientUser {
  id: number;
  email: string;
  full_name: string | null;
  role: string; // admin, client, designer, super_admin
  subscription_status: string; // free, pro, enterprise
  package_id: number | null;
  is_verified: boolean;
  created_at: string;
}

interface Package {
  id: number;
  name: string;
  price: number;
}

export const AdminClients: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [clients, setClients] = useState<ClientUser[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingClient, setEditingClient] = useState<ClientUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSubStatus, setEditSubStatus] = useState('');
  const [editPackageId, setEditPackageId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClientsAndPackages();
  }, []);

  const fetchClientsAndPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, packagesRes] = await Promise.all([
        apiFetch<ClientUser[]>('/api/users'),
        apiFetch<Package[]>('/api/packages')
      ]);

      setClients((usersRes.data || []).filter(u => u.role !== 'super_admin'));
      setPackages(packagesRes.data || []);
    } catch (err) {
      console.error('Failed to load clients or packages:', err);
      setError('Could not load clients or package lists.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (client: ClientUser) => {
    setEditingClient(client);
    setEditFullName(client.full_name || '');
    setEditRole(client.role);
    setEditSubStatus(client.subscription_status);
    setEditPackageId(client.package_id?.toString() || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      setSaving(true);
      
      const payload: any = {
        full_name: editFullName.trim(),
        role: editRole,
        subscription_status: editSubStatus,
        package_id: editPackageId ? Number(editPackageId) : null
      };

      const res = await apiFetch<ClientUser>(`/api/users/${editingClient.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.data) {
        setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...payload } : c));
        setEditingClient(null);
      }
    } catch (err: any) {
      console.error('Failed to save client edits:', err);
      setError(err.message || 'Saving client failed.');
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
        <h3 className="text-xl font-bold text-black/80">Klantenbeheer & Abonnementen</h3>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/[0.02] text-[10px] font-bold uppercase tracking-widest text-black/40">
                <th className="px-6 py-4">Klant</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Abonnement</th>
                <th className="px-6 py-4">Toegewezen Package</th>
                <th className="px-6 py-4">Geverifieerd</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {clients.map((client) => {
                const clientPackage = packages.find(p => p.id === client.package_id);
                return (
                  <tr key={client.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-black/80">
                          {client.full_name || 'Naam Onbekend'}
                        </span>
                        <span className="text-[10px] font-semibold text-black/40 mt-0.5">
                          {client.email} (ID: #{client.id})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                        client.role === 'admin' 
                          ? 'bg-blue-100 text-blue-700 border-blue-200' 
                          : client.role === 'designer'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-gray-100 text-black/60 border-gray-200'
                      }`}>
                        {client.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-black/70 capitalize">
                        {client.subscription_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-black/60">
                        {clientPackage ? clientPackage.name : 'Geen'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {client.is_verified ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <Clock size={16} className="text-yellow-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-black/40 font-semibold">
                      {format(new Date(client.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(client)}
                        className="p-2 hover:bg-black/5 rounded-lg text-[#006663] transition-colors"
                        title="Wijzig Klant"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingClient(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-6">
              <h4 className="font-bold text-lg text-black/80">Klant Bewerken</h4>
              <button onClick={() => setEditingClient(null)} className="text-black/40 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Volledige Naam</label>
                <input 
                  type="text" 
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Platform Rol</label>
                <select 
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                >
                  <option value="client">Client</option>
                  <option value="designer">Designer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Subscription Tier</label>
                <select 
                  value={editSubStatus}
                  onChange={(e) => setEditSubStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Toegewezen Package</label>
                <select 
                  value={editPackageId}
                  onChange={(e) => setEditPackageId(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-2xl outline-none font-semibold text-xs focus:bg-white focus:border-black/10 transition-all"
                >
                  <option value="">Geen package gekoppeld</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id.toString()}>{p.name} (€{(p.price / 100).toFixed(2)}/m)</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
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
