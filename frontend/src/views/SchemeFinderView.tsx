import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Filter, Bookmark, ExternalLink, Award, Sparkles, UserCheck } from 'lucide-react';
import { translations, Language } from '../translations';

interface Scheme {
  id: number;
  name: string;
  description: string;
  category: string;
  benefits: string;
  eligibility_criteria: string;
  required_documents: string;
  application_process: string;
  official_url: string;
  last_updated_date: string;
}

interface RecommendedResult {
  scheme: Scheme;
  score: number;
  level: 'High Match' | 'Medium Match' | 'Low Match';
}

interface UserProfile {
  age?: number;
  gender?: string;
  occupation?: string;
  income?: number;
  education?: string;
  location?: string;
  farmer_status?: boolean;
  shg_membership?: boolean;
}

export default function SchemeFinderView({ token, userProfile, language }: { token: string; userProfile: UserProfile | null; language?: Language }) {
  const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'recommender'>('all');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [savedSchemeIds, setSavedSchemeIds] = useState<number[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const t = translations[language || 'en'];

  // Recommendation engine inputs
  const [age, setAge] = useState(userProfile?.age?.toString() || '25');
  const [gender, setGender] = useState(userProfile?.gender || 'Female');
  const [occupation, setOccupation] = useState(userProfile?.occupation || 'Tailoring');
  const [income, setIncome] = useState(userProfile?.income?.toString() || '50000');
  const [location, setLocation] = useState(userProfile?.location || 'Poochinayakkanpatti');
  const [farmerStatus, setFarmerStatus] = useState<boolean>(userProfile?.farmer_status || false);
  const [shgMembership, setShgMembership] = useState<boolean>(userProfile?.shg_membership || false);
  const [recommendations, setRecommendations] = useState<RecommendedResult[]>([]);
  const [runningRec, setRunningRec] = useState(false);

  const categories = [
    'Women Empowerment',
    'Agriculture',
    'Education',
    'Scholarships',
    'Employment',
    'Skill Development',
    'Entrepreneurship',
    'Health & Welfare',
    'Water Resources',
    'Rural Development',
    'SHG Programs'
  ];

  useEffect(() => {
    fetchSchemes();
    if (token) {
      fetchBookmarks();
    }
  }, [category, search, token]);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/schemes', {
        params: { category, search }
      });
      setSchemes(res.data);
    } catch (e) {
      console.error('Error fetching schemes', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const res = await axios.get('/api/saved-schemes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedSchemeIds(res.data.map((s: Scheme) => s.id));
    } catch (e) {
      console.error('Error fetching bookmarks', e);
    }
  };

  const toggleBookmark = async (schemeId: number) => {
    if (!token) {
      alert(language === 'ta' ? 'திட்டங்களைச் சேமிக்க தயவுசெய்து உள்நுழையவும்.' : 'Please log in to save and bookmark schemes.');
      return;
    }
    try {
      const res = await axios.post(`/api/schemes/${schemeId}/bookmark`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.bookmarked) {
        setSavedSchemeIds([...savedSchemeIds, schemeId]);
      } else {
        setSavedSchemeIds(savedSchemeIds.filter(id => id !== schemeId));
      }
    } catch (e) {
      console.error('Bookmark error', e);
    }
  };

  const runRecommender = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunningRec(true);
    try {
      const res = await axios.post('/api/recommendations/run', {
        age: parseInt(age),
        gender,
        occupation,
        income: parseFloat(income),
        location,
        farmer_status: farmerStatus,
        shg_membership: shgMembership
      });
      setRecommendations(res.data);
    } catch (err) {
      console.error('Recommender error', err);
    } finally {
      setRunningRec(false);
    }
  };

  const savedSchemes = schemes.filter(s => savedSchemeIds.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-500" />
            {t.schemes}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'ta' ? 'அரசாங்க நலத்திட்டங்களைக் கண்டறிந்து, தகுதிகளைச் சரிபார்த்துச் சேமிக்கவும்.' : 'Discover, check eligibility, and save state and central government schemes.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 text-xs font-semibold rounded ${activeTab === 'all' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            {t.allSchemes}
          </button>
          {token && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-1.5 text-xs font-semibold rounded ${activeTab === 'saved' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              {t.saved} ({savedSchemeIds.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('recommender')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1.5 ${activeTab === 'recommender' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <UserCheck className="h-3.5 w-3.5" /> {t.recommendationEngine}
          </button>
        </div>
      </div>

      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Search/Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'ta' ? 'திட்டப் பெயர் அல்லது விபரங்களைக் கொண்டு தேடுக...' : 'Search schemes by name or details...'}
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
                <option value="">{language === 'ta' ? 'அனைத்துப் பிரிவுகளும்' : 'All Categories'}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheme Cards Grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-500">{language === 'ta' ? 'திட்டங்களை ஏற்றுகிறது...' : 'Loading schemes catalog...'}</div>
          ) : schemes.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg border-slate-200 dark:border-slate-800">
              {language === 'ta' ? 'எந்த திட்டங்களும் கண்டறியப்படவில்லை.' : 'No government schemes match the selected filters.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {schemes.map(scheme => (
                <div key={scheme.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded">
                          {scheme.category}
                        </span>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mt-1">{scheme.name}</h3>
                      </div>
                      <button
                        onClick={() => toggleBookmark(scheme.id)}
                        className={`p-1.5 border rounded hover:bg-slate-50 dark:hover:bg-slate-800 ${savedSchemeIds.includes(scheme.id) ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 border-primary-300 dark:border-primary-800' : 'text-slate-400 border-slate-200 dark:border-slate-800'}`}
                      >
                        <Bookmark className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{scheme.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500">
                    <div><strong>{t.benefits}:</strong> {scheme.benefits}</div>
                    <div><strong>{language === 'ta' ? 'தகுதி வரம்புகள்' : 'Eligibility'}:</strong> {scheme.eligibility_criteria}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-slate-400">{t.lastUpdated}: {scheme.last_updated_date}</span>
                    <a
                      href={scheme.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:underline"
                    >
                      {t.officialWebsite} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedSchemes.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg border-slate-200 dark:border-slate-800">
              {language === 'ta' ? 'சேமிக்கப்பட்ட திட்டங்கள் எதுவும் இல்லை.' : 'No saved schemes. Bookmark schemes to view them here.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {savedSchemes.map(scheme => (
                <div key={scheme.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded">
                          {scheme.category}
                        </span>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mt-1">{scheme.name}</h3>
                      </div>
                      <button
                        onClick={() => toggleBookmark(scheme.id)}
                        className="p-1.5 border rounded bg-primary-50 dark:bg-primary-950/20 text-primary-600 border-primary-300 dark:border-primary-800"
                      >
                        <Bookmark className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{scheme.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500">
                    <div><strong>{t.benefits}:</strong> {scheme.benefits}</div>
                    <div><strong>{language === 'ta' ? 'தகுதி வரம்புகள்' : 'Eligibility'}:</strong> {scheme.eligibility_criteria}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-slate-400">{t.lastUpdated}: {scheme.last_updated_date}</span>
                    <a
                      href={scheme.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:underline"
                    >
                      {t.officialWebsite} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'recommender' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommender Form (Left) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-subtle lg:col-span-1 h-fit">
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
              <Award className="h-5 w-5 text-primary-500" /> {t.demographicsVerify}
            </h2>
            <form onSubmit={runRecommender} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t.age}</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t.gender}</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="Female">{t.female}</option>
                  <option value="Male">{t.male}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t.income}</label>
                <input
                  type="number"
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t.occupation}</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={e => setOccupation(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t.location}</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={farmerStatus}
                    onChange={e => setFarmerStatus(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{t.farmerCheck}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shgMembership}
                    onChange={e => setShgMembership(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{t.shgCheck}</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded text-xs transition duration-200"
                disabled={runningRec}
              >
                {runningRec ? (language === 'ta' ? 'திட்டங்களைக் கணக்கிடுகிறது...' : 'Running Engine...') : t.calcSchemes}
              </button>
            </form>
          </div>

          {/* Results (Right) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">
              {t.recommendations} {recommendations.length > 0 ? `(${recommendations.length})` : ''}
            </h2>

            {recommendations.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-500 text-sm">
                {language === 'ta' ? 'உங்கள் தகவல்களை உள்ளிட்டு "தகுதியான திட்டங்களைக் கணக்கிடு" என்பதை அழுத்தவும்.' : 'Enter your demographics and click "Calculate Eligible Schemes" to see recommended government programs.'}
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map(({ scheme, score, level }) => {
                  let badgeColor = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
                  let levelText = level;
                  if (level === 'High Match') {
                    badgeColor = 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900';
                    levelText = t.highMatch as any;
                  } else if (level === 'Medium Match') {
                    badgeColor = 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900';
                    levelText = t.medMatch as any;
                  } else if (level === 'Low Match') {
                    levelText = t.lowMatch as any;
                  }

                  return (
                    <div
                      key={scheme.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-2">
                            {scheme.category}
                          </span>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-md inline">{scheme.name}</h3>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeColor} self-start sm:self-center`}>
                          {levelText} ({score}%)
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-400">{scheme.description}</p>

                      <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded text-xs space-y-2 border border-slate-100 dark:border-slate-800/40">
                        <div><strong>{t.benefits}:</strong> {scheme.benefits}</div>
                        <div><strong>{t.requiredDocs}:</strong> {scheme.required_documents}</div>
                        <div><strong>{t.appProcess}:</strong> {scheme.application_process}</div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">Updated: {scheme.last_updated_date}</span>
                        <a
                          href={scheme.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:underline"
                        >
                          {t.officialWebsite} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
