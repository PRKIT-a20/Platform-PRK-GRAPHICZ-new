import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ReceiptUploadProps {
  onUploadSuccess: () => void;
}

export default function ReceiptUpload({ onUploadSuccess }: ReceiptUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [amount, setAmount] = useState('500');
  const [file, setFile] = useState<File | null>(null);

  const onDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      alert('Please upload a valid PDF file only.');
      return;
    }
    if (acceptedFiles && acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        alert('Please upload a PDF file only.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!user || !file || !amount) return;
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random()}.${fileExt}`;

    try {
      // 1. Upload PDF to Storage
      const { error: uploadError, data } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Insert into receipts table
      const { error: dbError } = await supabase
        .from('receipts')
        .insert([
          {
            user_id: user.id,
            upload_url: data?.path,
            status: 'pending',
            amount: parseFloat(amount)
          }
        ]);

      if (dbError) throw dbError;

      onUploadSuccess();
      setFile(null);
      setAmount('500');
    } catch (error: any) {
      console.error('Error submitting receipt:', error);
      alert(`Failed to submit receipt: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'application/pdf': []},
    multiple: false
  });

  return (
    <div className="bg-white rounded-3xl border border-black/5 p-8 space-y-6">
      <h3 className="text-xl font-bold">Submit Payment</h3>
      
      <div {...getRootProps()} className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-brand-primary bg-brand-primary/5' : 'border-black/10 hover:border-brand-primary/50'}`}>
        <input {...getInputProps()} />
        <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="text-brand-primary" size={24} />
        </div>
        <p className="text-black/60 font-medium">{file ? file.name : 'Drag & drop or click to select your PDF receipt'}</p>
      </div>
      
      <div className="flex gap-4">
        <input 
          type="number"
          placeholder="Amount (e.g., 500)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 px-4 py-4 bg-black/5 border border-transparent rounded-2xl outline-none font-medium"
        />
        <button 
          onClick={handleUpload}
          disabled={uploading || !file || !amount}
          className="px-8 py-4 bg-brand-primary text-brand-secondary rounded-2xl font-bold hover:bg-brand-secondary hover:text-brand-primary transition-all disabled:opacity-50"
        >
          {uploading ? <Loader2 className="animate-spin" /> : 'Submit'}
        </button>
      </div>
    </div>
  );
}
