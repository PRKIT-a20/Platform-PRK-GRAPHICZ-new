import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: number;
  description: string;
  amount: number;
  status: 'unpaid' | 'paid';
  due_date: string;
  pdf_url?: string;
}

export default function InvoiceList() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user?.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (invoice: Invoice) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, '_blank');
    } else {
      alert('PDF not available for this invoice.');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="bg-white rounded-3xl border border-black/5 p-8">
      <h2 className="text-2xl font-bold mb-6">Invoices</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="text-black/40 text-sm uppercase tracking-widest font-bold">
              <th className="pb-4">Description</th>
              <th className="pb-4">Amount</th>
              <th className="pb-4">Due Date</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td className="py-4 font-bold">{invoice.description}</td>
                <td className="py-4 font-bold">${invoice.amount}</td>
                <td className="py-4 font-medium text-black/60">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${invoice.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="py-4">
                  <button 
                    onClick={() => handleDownload(invoice)}
                    className="flex items-center gap-2 text-brand-primary font-bold text-sm hover:underline"
                  >
                    <Download size={16} /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
