import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sprout, FileText, Calendar, BookOpen, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import { translations, Language } from '../translations';

interface Program {
  id: number;
  title: string;
  description: string;
  category: string;
  instructor: string;
  date: string;
  location: string;
  capacity: number;
  registered_count: number;
}

interface Request {
  id: number;
  user_id: number;
  request_type: 'Support' | 'Field Visit';
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  created_at: string;
  userName?: string;
}

interface LearningResource {
  id: number;
  title: string;
  category: string;
  content_type: string;
  content_body: string;
}

export default function AgricultureSupportView({ token, userRole, language }: { token: string; userRole: string | null; language?: Language }) {
  const t = translations[language || 'en'];
  const [activeTab, setActiveTab] = useState<'programs' | 'requests' | 'guides'>('programs');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [guides, setGuides] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Form state
  const [reqType, setReqType] = useState<'Support' | 'Field Visit'>('Support');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [progRes, reqRes, learnRes] = await Promise.all([
        axios.get('/api/women/programs'),
        token ? axios.get('/api/agriculture/requests', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ data: [] }),
        axios.get('/api/learning')
      ]);

      // Filter training programs to only show Agriculture Workshops
      setPrograms(progRes.data.filter((p: Program) => p.category === 'Agriculture Workshop'));
      setRequests(reqRes.data);
      // Filter learning resources to Agriculture
      setGuides(learnRes.data.filter((r: LearningResource) => r.category === 'Agriculture'));
    } catch (e) {
      console.error('Error fetching agriculture data', e);
    } finally {
      setLoading(false);
    }
  };

  const registerProgram = async (programId: number) => {
    if (!token) {
      alert('Please log in to register for workshops.');
      return;
    }
    try {
      await axios.post(`/api/women/programs/${programId}/register`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Successfully registered for the training program!');
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Registration failed.');
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in to submit requests.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/agriculture/requests', {
        request_type: reqType,
        description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Request logged successfully!');
      setDescription('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateRequestStatus = async (id: number, newStatus: string) => {
    try {
      await axios.put(`/api/agriculture/requests/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Status updated successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  const isStaff = userRole === 'Admin' || userRole === 'Staff';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Sprout className="h-6 w-6 text-primary-500" />
            {t.agriculture}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'ta' ? 'விவசாயிகளுக்கு பட்டறைகள், மண் பரிசோதனை, வயல்வெளி வருகை மற்றும் பயிர் ஆதாரங்களை வழங்குகிறது.' : 'Empowering farmers with workshops, soil diagnostics, field visits, and crop resources.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${activeTab === 'programs' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Calendar className="h-3.5 w-3.5" /> {t.farmingWorkshops}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${activeTab === 'requests' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <FileText className="h-3.5 w-3.5" /> {t.supportRequests}
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${activeTab === 'guides' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <BookOpen className="h-3.5 w-3.5" /> {t.farmingGuides}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{language === 'ta' ? 'விவசாய உதவி மைய தகவல்களை ஏற்றுகிறது...' : 'Loading agriculture hub data...'}</div>
      ) : (
        <>
          {activeTab === 'programs' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {programs.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-500 border border-dashed rounded-lg">
                  {language === 'ta' ? 'இந்த நேரத்தில் செயலில் உள்ள விவசாயப் பட்டறைகள் எதுவும் பட்டியலிடப்படவில்லை.' : 'No active farming workshops listed at this time.'}
                </div>
              ) : (
                programs.map(prog => (
                  <div key={prog.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 dark:bg-green-950/40 px-2.5 py-0.5 rounded">
                          {prog.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          {prog.registered_count} / {prog.capacity} {language === 'ta' ? 'பதிவுசெய்துள்ளனர்' : 'Registered'}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{prog.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{prog.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <div><strong>{language === 'ta' ? 'பயிற்சியாளர்' : 'Instructor'}:</strong> {prog.instructor}</div>
                      <div><strong>{language === 'ta' ? 'தேதி' : 'Date'}:</strong> {prog.date}</div>
                      <div className="col-span-2"><strong>{language === 'ta' ? 'இடம்' : 'Location'}:</strong> {prog.location}</div>
                    </div>

                    <button
                      onClick={() => registerProgram(prog.id)}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded text-xs transition duration-200"
                      disabled={prog.registered_count >= prog.capacity}
                    >
                      {prog.registered_count >= prog.capacity 
                        ? (language === 'ta' ? 'இடங்கள் முடிந்தது' : 'Full Capacity') 
                        : (language === 'ta' ? 'பட்டறையில் பதிவு செய்' : 'Register for Workshop')}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form (Left) */}
              {!isStaff && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-subtle lg:col-span-1 h-fit">
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                    <PlusCircle className="h-5 w-5 text-primary-500" /> {t.logAgriRequest}
                  </h2>
                  <form onSubmit={submitRequest} className="space-y-4 text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t.requestType}</label>
                      <select
                        value={reqType}
                        onChange={e => setReqType(e.target.value as any)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="Support">{t.generalFarming}</option>
                        <option value="Field Visit">{t.fieldVisit}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t.description}</label>
                      <textarea
                        rows={4}
                        placeholder={language === 'ta' ? 'விவசாய கவலைகள் அல்லது பூச்சி/மண் பிரச்சனைகளை விவரிக்கவும்...' : "Detail your request or pest/soil problems..."}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded text-xs transition duration-200"
                      disabled={submitting}
                    >
                      {submitting ? (language === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...') : t.logRequestBtn}
                    </button>
                  </form>
                </div>
              )}

              {/* Requests List (Right) */}
              <div className={isStaff ? 'lg:col-span-3 space-y-4' : 'lg:col-span-2 space-y-4'}>
                <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">
                  {isStaff ? t.allFarmerTickets : t.farmerTickets}
                </h2>

                {requests.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-500 text-sm">
                    {language === 'ta' ? 'செயலில் உள்ள கோரிக்கைகள் எதுவும் இல்லை.' : 'No active support requests found.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map(req => {
                      let statusBadge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                      if (req.status === 'In Progress') statusBadge = 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-300';
                      else if (req.status === 'Resolved') statusBadge = 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300';

                      return (
                        <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {req.request_type === 'Field Visit' ? t.fieldVisit : t.generalFarming} • ID #{req.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadge}`}>
                              {req.status}
                            </span>
                          </div>

                          {isStaff && (
                            <div className="text-xs text-slate-500">
                              <strong>{language === 'ta' ? 'விவசாயி பெயர்' : 'Farmer Name'}:</strong> {req.userName}
                            </div>
                          )}

                          <p className="text-sm text-slate-700 dark:text-slate-300">{req.description}</p>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-2 gap-2">
                            <span>{language === 'ta' ? 'பதிவு செய்த நாள்' : 'Logged at'}: {new Date(req.created_at).toLocaleString()}</span>
                            
                            {isStaff && req.status !== 'Resolved' && (
                              <div className="flex gap-2">
                                {req.status === 'Pending' && (
                                  <button
                                    onClick={() => updateRequestStatus(req.id, 'In Progress')}
                                    className="px-2 py-1 bg-orange-500 text-white rounded text-[10px] font-semibold hover:bg-orange-600 transition"
                                  >
                                    {t.acceptRequest}
                                  </button>
                                )}
                                <button
                                  onClick={() => updateRequestStatus(req.id, 'Resolved')}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-[10px] font-semibold hover:bg-green-700 transition"
                                >
                                  {t.markResolved}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'guides' && (
            <div className="space-y-4">
              {guides.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg">
                  {language === 'ta' ? 'விவசாய கையேடுகள் இன்னும் பதிவேற்றப்படவில்லை.' : 'No farming learning guides uploaded yet.'}
                </div>
              ) : (
                guides.map(guide => (
                  <div key={guide.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-subtle space-y-3">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary-500" /> {guide.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                      {guide.content_body}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
