import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  BookOpen, 
  Search, 
  Folder, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  FileText,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface WikiArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  visibility: string; // public, client, internal
  client_id: number | null;
  created_at: string;
}

export const ClientResourceWiki: React.FC = () => {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Categories state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Selected active article
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<WikiArticle[]>('/api/wiki_articles');
      setArticles(res.data || []);
    } catch (err) {
      console.error('Failed to fetch wiki articles:', err);
      setError('Could not load Wiki articles.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#006663]" size={40} />
      </div>
    );
  }

  // Extract unique categories
  const categories = Array.from(new Set(articles.map(a => a.category)));

  // Filter articles by query and category
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory ? article.category === selectedCategory : true;
    
    return matchesSearch && matchesCategory;
  });

  if (selectedArticle) {
    return (
      <div className="space-y-6 animate-fade-in text-left">
        {/* Back navigation header */}
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <button 
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-black/5 rounded-xl font-bold text-sm text-black/60 transition-all"
          >
            <ArrowLeft size={16} /> Terug naar Wiki Overzicht
          </button>
          
          <span className="font-extrabold text-xs bg-black/5 text-black/60 px-3 py-1 rounded-full uppercase tracking-wider">
            {selectedArticle.category}
          </span>
        </div>

        {/* Read Layout */}
        <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6 max-w-3xl mx-auto">
          <div className="space-y-2 border-b border-black/5 pb-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-black/90 leading-tight">
              {selectedArticle.title}
            </h2>
            <p className="text-xs text-black/30 font-semibold">
              Publicatiedatum: {format(new Date(selectedArticle.created_at), 'MMM d, yyyy')}
            </p>
          </div>

          <div className="text-sm text-black/70 leading-relaxed font-semibold space-y-4 whitespace-pre-line">
            {selectedArticle.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header with search */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-black/80 flex items-center gap-2">
            <BookOpen size={24} className="text-[#006663]" />
            Resource Wiki & Processen
          </h2>
          <p className="text-xs font-semibold text-black/40 mt-1">
            Vind instructies, templates, onboardingsgidsen en antwoorden over onze ontwerpprocessen.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" size={16} />
          <input 
            type="text" 
            placeholder="Zoeken in Wiki..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-black/5 rounded-2xl outline-none font-semibold text-xs border border-transparent focus:bg-white focus:border-black/10 transition-all shadow-inner"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main wiki area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories rail */}
        <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4 h-fit">
          <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 px-2">Categorieën</h4>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                selectedCategory === null 
                  ? 'bg-[#006663]/5 text-[#006663]' 
                  : 'text-black/60 hover:bg-black/5 hover:text-black'
              }`}
            >
              <Folder size={16} className={selectedCategory === null ? 'text-[#006663]' : 'text-black/40'} />
              <span>Alles Weergeven</span>
            </button>

            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                    isActive 
                      ? 'bg-[#006663]/5 text-[#006663]' 
                      : 'text-black/60 hover:bg-black/5 hover:text-black'
                  }`}
                >
                  <Folder size={16} className={isActive ? 'text-[#006663]' : 'text-black/40'} />
                  <span className="truncate">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Articles list */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-sm font-extrabold text-black/40 uppercase tracking-widest px-2">
            Artikelen ({filteredArticles.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((article) => (
              <div 
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
              >
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-black/30 px-2.5 py-0.5 rounded-full bg-black/5 border border-black/5">
                    {article.category}
                  </span>
                  <h4 className="font-extrabold text-base text-black/80 mt-3 line-clamp-1">
                    {article.title}
                  </h4>
                  <p className="text-xs text-black/40 line-clamp-2 mt-1.5 font-medium leading-relaxed">
                    {article.content}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-black/5 pt-4 mt-4 text-[10px] font-bold uppercase tracking-wider text-[#006663]">
                  <span className="flex items-center gap-1">
                    <FileText size={12} /> Lees Artikel
                  </span>
                  <ChevronRight size={14} className="text-[#006663]/40" />
                </div>
              </div>
            ))}

            {filteredArticles.length === 0 && (
              <div className="md:col-span-2 py-16 text-center bg-white border border-dashed border-black/10 rounded-3xl text-black/40 font-semibold">
                Geen wiki artikelen gevonden.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
