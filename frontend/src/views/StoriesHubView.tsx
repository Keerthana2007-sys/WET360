import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Heart, Sparkles, User } from 'lucide-react';
import { translations, Language } from '../translations';

interface Story {
  id: number;
  title: string;
  category: 'General' | 'Agriculture' | 'Water' | 'Women';
  content: string;
  image_url: string;
  video_url: string;
  beneficiary_name: string;
}

export default function StoriesHubView({ language }: { language?: Language }) {
  const t = translations[language || 'en'];
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/stories');
      setStories(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          {t.storiesTitle}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.storiesTagline}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          {language === 'ta' ? 'வெற்றி கதைகளை ஏற்றுகிறது...' : 'Loading success stories...'}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg">
          {t.noStories}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map(story => (
            <div key={story.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-subtle flex flex-col justify-between">
              {story.image_url && (
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <img
                    src={story.image_url}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 bg-pink-100 px-2 py-0.5 rounded shadow">
                      {language === 'ta' 
                        ? `${story.category === 'Agriculture' ? 'விவசாய' : story.category === 'Water' ? 'நீர்' : story.category === 'Women' ? 'பெண்கள்' : 'பொது'} தாக்கம்` 
                        : `${story.category} Impact`}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-5 flex-grow space-y-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-snug">{story.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{story.content}</p>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <User className="h-3.5 w-3.5 text-slate-400" /> {t.beneficiary}: {story.beneficiary_name}
                </span>
                <span className="flex items-center gap-0.5 text-pink-600 font-bold">
                  <Sparkles className="h-3.5 w-3.5" /> {t.inspiringImpact}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
