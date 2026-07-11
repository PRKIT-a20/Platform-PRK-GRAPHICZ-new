import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Loader2, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ClientInvoice {
  id: string;
  user_id: string;
  file_url: string;
  status: 'Pending' | 'Paid' | 'Rejected';
  amount: number;
  created_at: string;
}

export default function AdminInvoiceManager() {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('client_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileUrl: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('invoices')
        .createSignedUrl(fileUrl, 60 * 60); // 1 hour expiry

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to generate download link.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'Pending' | 'Paid' | 'Rejected') => {
    setUpdating(id);
    try {
      const { error } = await supabase
        .from('client_invoices')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setInvoices(invoices.map(inv => 
        inv.id === id ? { ...inv, status: newStatus } : inv
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    setUpdating(id);
    try {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('invoices')
        .remove([fileUrl]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }

      // 2. Delete from database
      const { error: dbError } = await supabase
        .from('client_invoices')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // 3. Update state
      setInvoices(invoices.filter(inv => inv.id !== id));
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      alert(`Failed to delete invoice: ${error?.message || 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Paid': return 'bg-green-50 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="bg-white rounded-3xl border border-black/5 p-8">
      <h2 className="text-2xl font-bold mb-6">Client Invoices</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="text-black/40 text-sm uppercase tracking-widest font-bold">
              <th className="pb-4">Client ID</th>
              <th className="pb-4">Amount</th>
              <th className="pb-4">Date Submitted</th>
              <th className="pb-4">Status</th>
              <th className="pb-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {invoices.map(invoice => (
              <tr key={invoice.id} className="hover:bg-black/[0.01] transition-colors">
                <td className="py-4 font-medium text-sm text-black/60">
                  {invoice.user_id.substring(0, 8)}...
                </td>
                <td className="py-4 font-bold">${invoice.amount.toFixed(2)}</td>
                <td className="py-4 font-medium text-black/60">
                  {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                </td>
                <td className="py-4">
                  <select 
                    value={invoice.status}
                    onChange={(e) => handleStatusChange(invoice.id, e.target.value as any)}
                    disabled={updating === invoice.id}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border outline-none cursor-pointer ${getStatusColor(invoice.status)}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleDownload(invoice.file_url)}
                      className="inline-flex items-center gap-1 text-brand-primary font-bold text-sm hover:underline"
                    >
                      <Download size={16} /> Download
                    </button>
                    <button 
                      onClick={() => handleDelete(invoice.id, invoice.file_url)}
                      disabled={updating === invoice.id}
                      className="inline-flex items-center gap-1 text-red-500 font-bold text-sm hover:underline disabled:opacity-50"
                      title="Delete Invoice"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-black/40 font-medium">
                  No invoices uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
