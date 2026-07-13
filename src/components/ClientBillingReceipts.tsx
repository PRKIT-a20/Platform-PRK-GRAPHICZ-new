import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  CreditCard, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  client_id: number;
  invoice_number: string;
  amount: number; // in cents
  status: string; // paid, pending, overdue
  file_url: string | null;
  due_date: string | null;
  created_at: string;
}

export const ClientBillingReceipts: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab Filter
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  
  // Payment processing status
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<Invoice[]>('/api/invoices');
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setError('Could not load billing invoices.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoice: Invoice) => {
    try {
      setPayingInvoiceId(invoice.id);
      
      await apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: invoice.id,
          amount: invoice.amount,
          payment_method: 'credit_card'
        })
      });

      // Reload invoices to show "paid" status
      await fetchInvoices();
    } catch (err: any) {
      console.error('Payment processing failed:', err);
      alert(err.message || 'Payment failed.');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#006663]" size={40} />
      </div>
    );
  }

  // Calculate quick metrics (sums in cents converted to Euro)
  const paidSum = invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0) / 100;
  const pendingSum = invoices.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0) / 100;
  const overdueSum = invoices.filter(i => i.status === 'overdue').reduce((acc, curr) => acc + curr.amount, 0) / 100;

  // Filter list
  const filteredInvoices = invoices.filter(invoice => {
    if (activeTab === 'all') return true;
    return invoice.status === activeTab;
  });

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Paid Card */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Totaal Voldaan</p>
            <p className="text-2xl font-extrabold text-black/80">€{paidSum.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Openstaand Saldo</p>
            <p className="text-2xl font-extrabold text-black/80">€{pendingSum.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        {/* Overdue Card */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Achterstallig</p>
            <p className="text-2xl font-extrabold text-red-600">€{overdueSum.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Invoice list panel */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 pb-4 gap-4">
          <h3 className="text-xl font-bold text-black/80">Facturen & Betalingsgeschiedenis</h3>
          
          <div className="flex bg-black/5 p-1 rounded-xl">
            {(['all', 'paid', 'pending', 'overdue'] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab ? 'bg-[#006663] text-white font-extrabold' : 'text-black/40 hover:text-black/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Rows */}
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div 
              key={invoice.id}
              className="p-6 bg-[#f8f9fa] rounded-2xl border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-lg text-black/80">{invoice.invoice_number}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                    invoice.status === 'paid' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : invoice.status === 'overdue'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-black/40">
                  Aangemaakt op {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Amount, download, pay */}
              <div className="flex flex-wrap items-center gap-6 md:justify-end shrink-0">
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Bedrag</p>
                  <p className="text-lg font-extrabold text-black/80 mt-0.5">
                    €{(invoice.amount / 100).toFixed(2)}
                  </p>
                </div>

                {invoice.due_date && (
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 font-semibold">Vervaldatum</p>
                    <p className="text-xs font-bold text-black/70 mt-1">
                      {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Download factuur */}
                  {invoice.file_url ? (
                    <a 
                      href={invoice.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-black/5 text-black/60 hover:text-black rounded-xl transition-all"
                      title="Download Factuur"
                    >
                      <Download size={16} />
                    </a>
                  ) : (
                    // Fallback simulated PDF download
                    <button 
                      onClick={() => alert(`Factuur ${invoice.invoice_number} downloaden... (In productie-omgeving downloadt dit de daadwerkelijke PDF van Cloud Storage)`)}
                      className="p-3 bg-black/5 text-black/30 hover:text-black/60 rounded-xl transition-all"
                      title="Simuleer Download"
                    >
                      <Download size={16} />
                    </button>
                  )}

                  {/* Pay pending / overdue */}
                  {invoice.status !== 'paid' && (
                    <button 
                      onClick={() => handlePayInvoice(invoice)}
                      disabled={payingInvoiceId === invoice.id}
                      className="px-4 py-2.5 bg-[#006663] hover:bg-opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-[#006663]/15"
                    >
                      {payingInvoiceId === invoice.id ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <CreditCard size={14} />
                      )}
                      Betaal Nu
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredInvoices.length === 0 && (
            <div className="py-16 text-center text-black/30 font-semibold text-sm">
              Geen facturen gevonden in deze categorie.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
