import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ClientInvoiceUploadProps {
  onUploadSuccess?: () => void;
}

export default function ClientInvoiceUpload({ onUploadSuccess }: ClientInvoiceUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        alert('Please upload a PDF file only.');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!user || !file || !amount) return;
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      // 1. Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Insert record into invoices table
      const { error: dbError } = await supabase
        .from('client_invoices')
        .insert([
          {
            user_id: user.id,
            file_url: data?.path,
            status: 'Pending',
            amount: parseFloat(amount)
          }
        ]);

      if (dbError) throw dbError;

      alert('Invoice uploaded successfully!');
      setFile(null);
      setAmount('');
      // Reset file input
      const fileInput = document.getElementById('invoice-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
    } catch (error: any) {
      console.error('Error uploading invoice:', error);
      alert(`Failed to upload invoice: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-black/5 p-8 space-y-6">
      <h3 className="text-xl font-bold">Upload Invoice</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Invoice File (PDF Only)</label>
          <div className="border-2 border-dashed border-black/10 rounded-2xl p-6 text-center hover:border-brand-primary/50 transition-colors relative">
            <input 
              type="file" 
              id="invoice-upload"
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="text-brand-primary" size={24} />
              <span className="text-black/60 font-medium">
                {file ? file.name : 'Click or drag PDF file to upload'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Amount ($)</label>
          <input 
            type="number"
            step="0.01"
            placeholder="e.g. 150.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium focus:bg-white focus:border-black/10 transition-all"
          />
        </div>

        <button 
          onClick={handleUpload}
          disabled={uploading || !file || !amount}
          className="w-full py-4 bg-brand-primary text-brand-secondary rounded-2xl font-bold hover:bg-brand-secondary hover:text-brand-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Submit Invoice'}
        </button>
      </div>
    </div>
  );
}
