import React, { useState } from 'react';
import axios from 'axios';
import { MessageSquare, Star, Send, ShieldCheck } from 'lucide-react';
import { translations, Language } from '../translations';

export default function FeedbackView({ token, language }: { token: string; language?: Language }) {
  const t = translations[language || 'en'];
  const [type, setType] = useState<'Survey' | 'Suggestion' | 'General Feedback'>('General Feedback');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/feedback', {
        type,
        content,
        rating
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSuccess(true);
      setContent('');
      setRating(5);
    } catch (e) {
      console.error(e);
      alert('Feedback submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary-500" />
          {t.feedbackTitle}
        </h1>
        <p className="text-sm text-slate-500">
          {t.feedbackTagline}
        </p>
      </div>

      {success ? (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-8 rounded-lg text-center space-y-3">
          <ShieldCheck className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.feedbackLogged}</h2>
          <p className="text-sm text-slate-500">
            {t.feedbackSuccessText}
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-1.5 px-4 rounded text-xs transition mt-2"
          >
            {t.submitAnotherFeedback}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-subtle">
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{t.feedbackType}</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-2.5 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="General Feedback">{language === 'ta' ? 'பொதுத் தளம் கருத்து' : 'General Platform Feedback'}</option>
                <option value="Suggestion">{language === 'ta' ? 'கிராம வளர்ச்சிப் பரிந்துரை' : 'Village Improvement Suggestion'}</option>
                <option value="Survey">{language === 'ta' ? 'திருப்தி கணக்கெடுப்பு' : 'Satisfaction Survey Response'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t.overallRating}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      className={`h-6 w-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-700'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{t.commentsSuggestions}</label>
              <textarea
                rows={5}
                placeholder={language === 'ta' ? 'உங்கள் கருத்துக்கள் அல்லது கிராம வளர்ச்சி அவதானிப்புகளைப் பகிர்ந்து கொள்ளுங்கள்...' : "Share your thoughts or report general village development observations..."}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-2.5 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded text-xs transition duration-200 flex items-center justify-center gap-1.5"
              disabled={submitting}
            >
              <Send className="h-3.5 w-3.5" /> {submitting ? (language === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...') : t.submitFeedbackBtn}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
