import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BookOpen, Search, Filter, BookOpenCheck } from 'lucide-react';
import { translations, Language } from '../translations';

interface Guide {
  id: number;
  title: string;
  category: 'Agriculture' | 'Water Conservation' | 'Financial Literacy' | 'Entrepreneurship' | 'Women Development' | 'Skill Development' | 'Scheme Awareness';
  content_type: 'Guide' | 'Document' | 'Video Link';
  content_body: string;
  url?: string;
}

export default function LearningCenterView({ language }: { language?: Language }) {
  const t = translations[language || 'en'];
  const [guides, setGuides] = useState<Guide[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = [
    'Agriculture',
    'Water Conservation',
    'Financial Literacy',
    'Entrepreneurship',
    'Women Development',
    'Skill Development',
    'Scheme Awareness'
  ];

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/learning');
      setGuides(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(search.toLowerCase()) || 
                          guide.content_body.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === '' || guide.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary-500" />
          {t.learningTitle}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.learningTagline}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchGuides}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="sm:w-64 relative">
          <Filter className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 appearance-none"
          >
            <option value="">{t.allCategories}</option>
            {categories.map(cat => {
              let catLabel = cat;
              if (language === 'ta') {
                if (cat === 'Agriculture') catLabel = 'விவசாயம்';
                else if (cat === 'Water Conservation') catLabel = 'நீர் பாதுகாப்பு';
                else if (cat === 'Financial Literacy') catLabel = 'நிதி கல்வியறிவு';
                else if (cat === 'Entrepreneurship') catLabel = 'தொழில்முனைவு';
                else if (cat === 'Women Development') catLabel = 'பெண்கள் மேம்பாடு';
                else if (cat === 'Skill Development') catLabel = 'திறன் வளர்ச்சி';
                else if (cat === 'Scheme Awareness') catLabel = 'நலத்திட்ட விழிப்புணர்வு';
              }
              return <option key={cat} value={cat}>{catLabel}</option>;
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{language === 'ta' ? 'கையேடுகளை ஏற்றுகிறது...' : 'Loading guides and materials...'}</div>
      ) : filteredGuides.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg">
          {t.noGuides}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGuides.map(guide => {
            let catLabel: string = guide.category;
            let typeLabel: string = guide.content_type;
            if (language === 'ta') {
              if (guide.category === 'Agriculture') catLabel = 'விவசாயம்';
              else if (guide.category === 'Water Conservation') catLabel = 'நீர் பாதுகாப்பு';
              else if (guide.category === 'Financial Literacy') catLabel = 'நிதி கல்வியறிவு';
              else if (guide.category === 'Entrepreneurship') catLabel = 'தொழில்முனைவு';
              else if (guide.category === 'Women Development') catLabel = 'பெண்கள் மேம்பாடு';
              else if (guide.category === 'Skill Development') catLabel = 'திறன் வளர்ச்சி';
              else if (guide.category === 'Scheme Awareness') catLabel = 'நலத்திட்ட விழிப்புணர்வு';

              if (guide.content_type === 'Guide') typeLabel = 'கையேடு';
              else if (guide.content_type === 'Document') typeLabel = 'ஆவணம்';
              else if (guide.content_type === 'Video Link') typeLabel = 'காணொளி இணைப்பு';
            }

            return (
              <div key={guide.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-0.5 rounded">
                    {catLabel} • {typeLabel}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-1.5">
                  <BookOpenCheck className="h-5 w-5 text-primary-500" /> {guide.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {guide.content_body}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
