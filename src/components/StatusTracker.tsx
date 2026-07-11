import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Receipt {
  id: number;
  amount: number;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export default function StatusTracker() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReceipts();
    }
  }, [user]);

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="text-yellow-500" size={20} />;
      case 'verified': return <CheckCircle2 className="text-green-500" size={20} />;
      case 'rejected': return <XCircle className="text-red-500" size={20} />;
      default: return null;
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="bg-white rounded-3xl border border-black/5 p-8">
      <h2 className="text-2xl font-bold mb-6">Receipt Status</h2>
      <div className="space-y-4">
        {receipts.map(receipt => (
          <div key={receipt.id} className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
            <div className="flex items-center gap-4">
              {getStatusIcon(receipt.status)}
              <div>
                <p className="font-bold capitalize">{receipt.status}</p>
                <p className="text-xs text-black/40 font-medium">{format(new Date(receipt.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
            <p className="font-bold">${receipt.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
