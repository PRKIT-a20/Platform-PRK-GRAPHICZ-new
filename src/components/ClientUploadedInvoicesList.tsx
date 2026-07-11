import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';

interface ClientInvoice {
  id: string;
  status: 'Pending' | 'Paid' | 'Rejected';
  amount: number;
  created_at: string;
  file_url: string;
}

interface ClientUploadedInvoicesListProps {
  refreshTrigger: number;
}

export default function ClientUploadedInvoicesList({ refreshTrigger }: ClientUploadedInvoicesListProps) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user, refreshTrigger]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('client_invoices')
        .select('*')
        .eq('user_id', user?.id)
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
        .createSignedUrl(fileUrl, 60 * 60);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to generate download link.');
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
      <h2 className="text-xl font-bold mb-6">Your Uploaded Invoices</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-black/40 text-sm uppercase tracking-widest font-bold">
              <th className="pb-4">Date</th>
              <th className="pb-4">Amount</th>
              <th className="pb-4">Status</th>
              <th className="pb-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td className="py-4 font-medium text-black/60">
                  {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                </td>
                <td className="py-4 font-bold">${invoice.amount.toFixed(2)}</td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <button 
                    onClick={() => handleDownload(invoice.file_url)}
                    className="inline-flex items-center gap-2 text-brand-primary font-bold text-sm hover:underline"
                  >
                    <Download size={16} /> View
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-black/40 font-medium">
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
