import React, { useState, useEffect } from 'react';
import { localDb as supabase } from '../lib/localStorageDb';
import { Plus, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';

interface ContentPlannerRow {
  id: string;
  user_id: string;
  post_date: string | null;
  content_pillar: string | null;
  boost: string | null;
  concept: string | null;
  text_on_design: string | null;
  design_description: string | null;
  caption: string | null;
  notice: string | null;
  scheduled_date: string | null;
  created_at: string;
}

export function ContentPlanner({ userId, isAdmin = false }: { userId: string, isAdmin?: boolean }) {
  const [rows, setRows] = useState<ContentPlannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContentPlannerRow>>({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchPlanner();
    }
  }, [userId]);

  const fetchPlanner = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_planner')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      console.error('Error fetching content planner:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const newRow = {
        user_id: userId,
        post_date: '',
        content_pillar: '',
        boost: '',
        concept: '',
        text_on_design: '',
        design_description: '',
        caption: '',
        notice: '',
        scheduled_date: ''
      };
      const { data, error } = await supabase.from('content_planner').insert(newRow);
      if (error) throw error;
      if (data && data[0]) {
        setRows(prev => [data[0], ...prev]);
        startEditing(data[0]);
      }
    } catch (err) {
      console.error('Failed to add row', err);
    }
  };

  const startEditing = (row: ContentPlannerRow) => {
    setEditingId(row.id);
    setEditForm(row);
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      const { error } = await supabase
        .from('content_planner')
        .update(editForm)
        .eq('id', editingId);
        
      if (error) throw error;
      setRows(prev => prev.map(r => r.id === editingId ? { ...r, ...editForm } as ContentPlannerRow : r));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this row?')) return;
    try {
      const { error } = await supabase.from('content_planner').delete().eq('id', id);
      if (error) throw error;
      setRows(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-black/20" size={40} />
      </div>
    );
  }

  const columns = [
    { key: 'post_date', label: 'Post Date' },
    { key: 'content_pillar', label: 'Content Pillar' },
    { key: 'boost', label: 'Boost' },
    { key: 'concept', label: 'Concept' },
    { key: 'text_on_design', label: 'Text on Design (TOD)' },
    { key: 'design_description', label: 'Design Description' },
    { key: 'caption', label: 'Caption' },
    { key: 'notice', label: 'Notice' },
    { key: 'scheduled_date', label: 'Scheduled Date' }
  ];

  return (
    <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-black/5 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-xl font-bold">Content Planner</h2>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-brand-secondary rounded-xl font-bold hover:bg-opacity-90 transition-all text-sm"
          >
            <Plus size={16} /> Add Row
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className="p-4 border-b border-black/5 text-xs font-bold uppercase tracking-wider text-black/40 bg-gray-50/50">
                  {col.label}
                </th>
              ))}
              {isAdmin && <th className="p-4 border-b border-black/5 bg-gray-50/50"></th>}
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? columns.length + 1 : columns.length} className="p-8 text-center text-black/40">
                  No content planned yet.
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.id} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors group">
                  {columns.map(col => (
                    <td key={col.key} className="p-4 align-top min-w-[150px]">
                      {editingId === row.id ? (
                        col.key === 'caption' || col.key === 'design_description' || col.key === 'text_on_design' ? (
                          <textarea
                            value={(editForm as any)[col.key] || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, [col.key]: e.target.value }))}
                            className="w-full p-2 bg-white border border-black/10 rounded-lg outline-none focus:border-brand-primary min-h-[80px] resize-y"
                            placeholder={col.label}
                          />
                        ) : (
                          <input
                            type={col.key.includes('date') ? 'date' : 'text'}
                            value={(editForm as any)[col.key] || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, [col.key]: e.target.value }))}
                            className="w-full p-2 bg-white border border-black/10 rounded-lg outline-none focus:border-brand-primary"
                            placeholder={col.label}
                          />
                        )
                      ) : (
                        <div className="whitespace-pre-wrap">{row[col.key as keyof ContentPlannerRow]}</div>
                      )}
                    </td>
                  ))}
                  {isAdmin && (
                    <td className="p-4 align-top w-20">
                      {editingId === row.id ? (
                        <div className="flex gap-2">
                          <button onClick={handleSave} className="p-2 bg-brand-primary text-brand-secondary rounded-lg hover:bg-opacity-90"><Save size={14} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-black/5 text-black rounded-lg hover:bg-black/10"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditing(row)} className="p-2 text-black/40 hover:text-black hover:bg-black/5 rounded-lg"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(row.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
