import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
}

interface SmartRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  userId?: string;
}

const SmartRequestForm: React.FC<SmartRequestFormProps> = ({ onSuccess, onCancel, userId }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    productType: '',
    deadline: '',
    brandId: '',
  });

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('id, name')
          .order('name');
        
        if (error) {
          // If the table doesn't exist yet, we'll just show an empty list or mock data
          console.warn('Could not fetch brands, table might not exist yet:', error);
        } else if (data) {
          setBrands(data);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setIsLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Logic: stuur data naar 'requests' tabel met status 'Submitted'
      const { error } = await supabase
        .from('requests')
        .insert([
          {
            user_id: userId,
            product_type: formData.productType,
            deadline: formData.deadline,
            brand_id: formData.brandId || null,
            status: 'Submitted',
            // Fallback fields for existing table structure just in case
            title: `${formData.productType} Request`,
            description: `Deadline: ${formData.deadline}`,
          }
        ]);

      if (error) throw error;

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      setErrorMsg(error.message || 'Er is een fout opgetreden bij het indienen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold uppercase tracking-widest text-[#006663]/70 mb-2">
          Producttype
        </label>
        <select
          name="productType"
          value={formData.productType}
          onChange={handleChange}
          required
          className="w-full px-4 py-4 bg-[#006663]/5 border border-transparent rounded-2xl focus:border-[#006663]/30 focus:ring-4 focus:ring-[#006663]/10 focus:bg-white transition-all outline-none font-medium text-[#333333]"
        >
          <option value="" disabled>Selecteer een producttype</option>
          <option value="Social Media Post">Social Media Post</option>
          <option value="Flyer">Flyer</option>
          <option value="Business Kaart">Business Kaart</option>
          <option value="Anders">Anders</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold uppercase tracking-widest text-[#006663]/70 mb-2">
          Brand Assets
        </label>
        <select
          name="brandId"
          value={formData.brandId}
          onChange={handleChange}
          disabled={isLoadingBrands}
          className="w-full px-4 py-4 bg-[#006663]/5 border border-transparent rounded-2xl focus:border-[#006663]/30 focus:ring-4 focus:ring-[#006663]/10 focus:bg-white transition-all outline-none font-medium text-[#333333] disabled:opacity-50"
        >
          <option value="" disabled>
            {isLoadingBrands ? 'Brands laden...' : 'Selecteer een brand (optioneel)'}
          </option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold uppercase tracking-widest text-[#006663]/70 mb-2">
          Deadline
        </label>
        <input
          type="date"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          required
          className="w-full px-4 py-4 bg-[#006663]/5 border border-transparent rounded-2xl focus:border-[#006663]/30 focus:ring-4 focus:ring-[#006663]/10 focus:bg-white transition-all outline-none font-medium text-[#333333]"
        />
      </div>

      <div className="flex gap-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 bg-[#006663]/5 text-[#006663] rounded-2xl font-bold hover:bg-[#006663]/10 transition-all"
          >
            Annuleren
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-4 bg-[#006663] text-[#ffd833] rounded-2xl font-bold hover:bg-[#ffd833] hover:text-[#006663] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Aanvraag Indienen'}
        </button>
      </div>
    </form>
  );
};

export default SmartRequestForm;
