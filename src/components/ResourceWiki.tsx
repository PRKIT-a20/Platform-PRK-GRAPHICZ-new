import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { Loader2, Search, BookOpen, ChevronRight, Filter } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export const ResourceWiki: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    let filtered = articles;
    if (activeCategory !== 'All') {
      filtered = filtered.filter(a => a.category === activeCategory);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(lower) || a.content.toLowerCase().includes(lower));
    }
    setFilteredArticles(filtered);
  }, [searchTerm, activeCategory, articles]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<Article[]>('/api/wiki_articles');
      setArticles(res.data || []);
      setFilteredArticles(res.data || []);
    } catch (err) {
      console.error('Failed to load wiki:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category)))];

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      {!selectedArticle ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="text" 
                placeholder="Search resources..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/5 rounded-2xl text-sm font-semibold outline-none focus:bg-white focus:border-brand-primary border border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Filter className="text-black/30 mx-2" size={18} />
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-brand-primary text-white' : 'bg-black/5 hover:bg-black/10 text-black/60'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(a => (
              <button 
                key={a.id}
                onClick={() => setSelectedArticle(a)}
                className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-lg transition-all text-left flex flex-col gap-3 group"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">{a.category}</span>
                <h3 className="font-bold text-lg group-hover:text-brand-primary transition-colors">{a.title}</h3>
                <p className="text-sm text-black/60 line-clamp-3">{a.content}</p>
                <span className="text-xs text-black/30 mt-auto pt-4">{format(new Date(a.created_at), 'MMM d, yyyy')}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setSelectedArticle(null)} className="text-sm font-bold text-brand-primary flex items-center gap-1">← Back to Resources</button>
          <div className="bg-white p-12 rounded-[2.5rem] border border-black/5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">{selectedArticle.category}</span>
            <h1 className="text-4xl font-bold my-4">{selectedArticle.title}</h1>
            <p className="text-sm text-black/40 mb-8">{format(new Date(selectedArticle.created_at), 'MMMM d, yyyy')}</p>
            <div className="prose prose-brand max-w-none text-black/80">
              <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
