import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Upload, 
  Loader2, 
  AlertCircle,
  File,
  Sparkles,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface Service {
  id: number;
  name: string;
  description: string;
}

interface Package {
  id: number;
  name: string;
  description: string;
}

interface PackageService {
  id: number;
  package_id: number;
  service_id: number;
}

interface Subscription {
  id: string;
  package_id: number;
  status: string;
}

interface RequestItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  product_type: string | null;
  deadline: string | null;
  created_at: string;
}

export const ClientRequestPanel: React.FC = () => {
  const { user } = useAuth();
  
  // Data States
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [packageServices, setPackageServices] = useState<PackageService[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  
  // Loading & UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeListTab, setActiveListTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Form Inputs
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchPanelData();
  }, []);

  const fetchPanelData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [servicesRes, packagesRes, pkgServRes, subsRes, reqsRes] = await Promise.all([
        apiFetch<Service[]>('/api/services').catch(() => ({ data: [] })),
        apiFetch<Package[]>('/api/packages').catch(() => ({ data: [] })),
        apiFetch<PackageService[]>('/api/package_services').catch(() => ({ data: [] })),
        apiFetch<Subscription[]>('/api/subscriptions').catch(() => ({ data: [] })),
        apiFetch<RequestItem[]>('/api/requests').catch(() => ({ data: [] }))
      ]);

      setServices(servicesRes.data || []);
      setPackages(packagesRes.data || []);
      setPackageServices(pkgServRes.data || []);
      setSubscriptions(subsRes.data || []);
      setRequests(reqsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching request panel data:', err);
      setError('Could not fetch packages, services or requests data.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Identify Client Subscription & Package
  const activeSub = subscriptions.find(s => s.status === 'active');
  const clientPackage = activeSub ? packages.find(p => p.id === activeSub.package_id) : null;

  // 2. Filter allowed services for client package
  const allowedServiceIds = clientPackage 
    ? packageServices.filter(ps => ps.package_id === clientPackage.id).map(ps => ps.service_id)
    : [];

  const clientServices = clientPackage 
    ? services.filter(s => allowedServiceIds.includes(s.id))
    : services; // If no subscription, fallback to show all (as non-paying/free/custom user)

  // Submissions handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !title || !description) return;

    try {
      setSubmitting(true);
      setError(null);

      const selectedService = services.find(s => s.id.toString() === selectedServiceId);
      const productType = selectedService ? selectedService.name : 'Anders';

      // Assemble full description including list of attachments
      let finalDescription = description;
      if (attachments.length > 0) {
        finalDescription += `\n\nAttachments: ${attachments.map(f => f.name).join(', ')}`;
      }

      await apiFetch('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: finalDescription,
          product_type: productType,
          deadline: deadline || null,
          status: 'pending'
        })
      });

      // Clear Form and refresh
      setTitle('');
      setDescription('');
      setDeadline('');
      setSelectedServiceId('');
      setAttachments([]);
      setShowForm(false);
      
      await fetchPanelData();
    } catch (err: any) {
      console.error('Failed to submit design request:', err);
      setError(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    );
  }

  // Filter requests by Tab
  const pendingRequests = requests.filter(r => 
    r.status === 'pending' || r.status === 'Submitted'
  );
  const approvedRequests = requests.filter(r => 
    r.status === 'approved' || r.status === 'delivered' || r.status === 'In Design Process' || r.status === 'Review'
  );
  const rejectedRequests = requests.filter(r => 
    r.status === 'rejected' || r.status === 'cancelled'
  );

  const getActiveList = () => {
    switch (activeListTab) {
      case 'approved': return approvedRequests;
      case 'rejected': return rejectedRequests;
      default: return pendingRequests;
    }
  };

  return (
    <div className="space-y-8">
      {/* Package Header Banner */}
      <div className="bg-gradient-to-r from-[#006663] to-[#004d4a] p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div>
          <div className="flex items-center gap-2 bg-[#ffd833]/15 border border-[#ffd833]/30 px-3 py-1 rounded-full text-[#ffd833] text-xs font-bold uppercase tracking-widest w-fit mb-3">
            <Sparkles size={12} />
            {clientPackage ? `${clientPackage.name} Package` : 'No Active Subscription'}
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {clientPackage ? 'Unlimited Design Requests Ready' : 'Access General Request Form'}
          </h2>
          <p className="text-white/60 text-sm mt-1 font-medium">
            {clientPackage 
              ? 'Request services included within your active package membership.'
              : 'Sign up for a subscription package to unlock unlimited designer output.'
            }
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-[#ffd833] text-[#006663] hover:bg-white hover:text-[#006663] px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg flex items-center gap-2 shrink-0"
        >
          <Plus size={18} />
          {showForm ? 'Sluit Formulier' : 'Nieuwe Aanvraag'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Submission Form */}
      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6 animate-fade-in">
          <h3 className="text-xl font-bold text-black/80">Nieuwe Design Aanvraag</h3>
          
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Service Type</label>
                <select 
                  required
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/5 transition-all text-sm"
                >
                  <option value="">Kies een dienst binnen uw pakket</option>
                  {clientServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Aanvraag Titel</label>
                <input 
                  type="text" 
                  required
                  placeholder="Bijv. Social Media Banner voor Zomer Campagne"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/5 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Gewenste Deadline (Optioneel)</label>
                <input 
                  type="date" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/5 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-6 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Beschrijving & Instructies</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Geef hier details over afmetingen, huisstijl, logo's en gewenste teksten..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/5 transition-all text-sm resize-none"
                />
              </div>

              {/* Reference File Drag and Drop */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Referentie Bestanden</label>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-[#006663] bg-[#006663]/5' 
                      : 'border-black/10 bg-black/5 hover:bg-black/10'
                  }`}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <input 
                    type="file" 
                    id="file-upload-input" 
                    multiple 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  <Upload className="mx-auto text-black/20 mb-2" size={24} />
                  <p className="text-xs font-bold text-black/60">Sleep bestanden hierheen of klik om te uploaden</p>
                  <p className="text-[10px] text-black/30 mt-1">PNG, JPG, PDF, SVG, AI of EPS (Max 10MB)</p>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-black/5 rounded-xl border border-black/5">
                        <div className="flex items-center gap-2 truncate">
                          <File size={14} className="text-[#006663]" />
                          <span className="text-xs font-medium truncate">{file.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeAttachment(idx)}
                          className="text-red-500 hover:text-red-700 font-bold text-xs"
                        >
                          Verwijder
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 pt-4 flex gap-4">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="flex-1 py-4 bg-black/5 text-black rounded-2xl font-bold hover:bg-black/10 transition-all text-sm"
              >
                Annuleren
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="flex-1 py-4 bg-[#006663] text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-md shadow-[#006663]/15"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Aanvraag Versturen'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests Tabs List */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 pb-4 gap-4">
          <h3 className="text-xl font-bold text-black/80">Uw Aanvragen</h3>
          
          <div className="flex bg-black/5 p-1 rounded-xl">
            <button 
              onClick={() => setActiveListTab('pending')}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 ${
                activeListTab === 'pending' ? 'bg-[#006663] text-white' : 'text-black/40 hover:text-black/60'
              }`}
            >
              <Clock size={14} />
              In Behandeling ({pendingRequests.length})
            </button>
            <button 
              onClick={() => setActiveListTab('approved')}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 ${
                activeListTab === 'approved' ? 'bg-[#006663] text-white' : 'text-black/40 hover:text-black/60'
              }`}
            >
              <CheckCircle size={14} />
              Goedgekeurd ({approvedRequests.length})
            </button>
            <button 
              onClick={() => setActiveListTab('rejected')}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 ${
                activeListTab === 'rejected' ? 'bg-[#006663] text-white' : 'text-black/40 hover:text-black/60'
              }`}
            >
              <XCircle size={14} />
              Geweigerd ({rejectedRequests.length})
            </button>
          </div>
        </div>

        {/* Requests Render */}
        <div className="space-y-4">
          {getActiveList().map((req) => (
            <div 
              key={req.id}
              className="p-6 bg-[#f8f9fa] rounded-2xl border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-lg hover:shadow-black/5 transition-all text-left"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-lg text-black/80">{req.title}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                    req.status === 'pending' || req.status === 'Submitted'
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : req.status === 'rejected' || req.status === 'cancelled'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-black/40">{req.product_type || 'Anders'}</p>
                {req.description && (
                  <p className="text-xs text-black/50 line-clamp-2 mt-2">{req.description}</p>
                )}
              </div>
              <div className="flex items-center gap-6 shrink-0">
                {req.deadline && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 flex items-center gap-1">
                      <Calendar size={10} /> Deadline
                    </p>
                    <p className="text-xs font-bold text-black/70 mt-0.5">
                      {format(new Date(req.deadline), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Ingediend</p>
                  <p className="text-xs font-bold text-black/70 mt-0.5">
                    {format(new Date(req.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {getActiveList().length === 0 && (
            <div className="py-16 text-center text-black/30 font-semibold text-sm">
              Geen aanvragen gevonden in deze categorie.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
