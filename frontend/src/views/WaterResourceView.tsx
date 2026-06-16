import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Droplets, ShieldAlert, CheckCircle2, Clock, PlusCircle, Map, Layers } from 'lucide-react';
import { translations, Language } from '../translations';

interface Reservoir {
  id: number;
  name: string;
  location: string;
  capacity: string;
  current_level: string;
}

interface WaterIssue {
  id: number;
  user_id: number;
  issue_type: string;
  location: string;
  description: string;
  image_url: string;
  status: 'Reported' | 'Investigating' | 'In Progress' | 'Resolved';
  created_at: string;
  userName?: string;
}

export default function WaterResourceView({ token, userRole, language }: { token: string; userRole: string | null; language?: Language }) {
  const t = translations[language || 'en'];
  const [activeTab, setActiveTab] = useState<'issues' | 'reservoirs'>('issues');
  const [issues, setIssues] = useState<WaterIssue[]>([]);
  const [reservoirs, setReservoirs] = useState<Reservoir[]>([]);
  const [loading, setLoading] = useState(true);

  // New Issue Form state
  const [issueType, setIssueType] = useState('Pipe Leakage');
  const [location, setLocation] = useState('Middle Street, Poochinayakkanpatti');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issueRes, resRes] = await Promise.all([
        token ? axios.get('/api/water/issues', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ data: [] }),
        axios.get('/api/water/reservoirs')
      ]);
      setIssues(issueRes.data);
      setReservoirs(resRes.data);
    } catch (e) {
      console.error('Error fetching water data', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in to report water issues.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/water/issues', {
        issue_type: issueType,
        location,
        description,
        image_url: photo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Water issue logged successfully!');
      setDescription('');
      setPhoto('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to log water issue.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateIssueStatus = async (id: number, newStatus: string) => {
    try {
      await axios.put(`/api/water/issues/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Status updated!');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  const parseCapacityNum = (str: string) => {
    return parseInt(str.replace(/,/g, '').replace(' Liters', '')) || 10000;
  };

  const isStaff = userRole === 'Admin' || userRole === 'Staff';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Droplets className="h-6 w-6 text-primary-500" />
            {t.waterTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.waterTagline}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${activeTab === 'issues' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <ShieldAlert className="h-3.5 w-3.5" /> {t.issueReporting}
          </button>
          <button
            onClick={() => setActiveTab('reservoirs')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${activeTab === 'reservoirs' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Layers className="h-3.5 w-3.5" /> {t.reservoirLevels}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{language === 'ta' ? 'நீர் ஆதார தகவல்களை ஏற்றுகிறது...' : 'Loading water support portal...'}</div>
      ) : (
        <>
          {activeTab === 'issues' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Report Issue Form (Left) */}
              {!isStaff && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-subtle lg:col-span-1 h-fit">
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                    <PlusCircle className="h-5 w-5 text-primary-500" /> {t.logWaterLeakage}
                  </h2>
                  <form onSubmit={submitIssue} className="space-y-4 text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{language === 'ta' ? 'சிக்கல் வகை' : 'Issue Type'}</label>
                      <select
                        value={issueType}
                        onChange={e => setIssueType(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="Pipe Leakage">{t.supplyPipelineLeakage}</option>
                        <option value="Water Scarcity">{t.waterSupplyScarcity}</option>
                        <option value="Quality Contamination">{t.waterContamination}</option>
                        <option value="Pumping Failure">{t.pumpMotorFailure}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t.locationStreet}</label>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t.description}</label>
                      <textarea
                        rows={3}
                        placeholder={language === 'ta' ? 'நீர் கசிவு உள்ள இடம், தீவிரம் போன்றவற்றை விவரிக்கவும்...' : "Detail the leakage spot, severity..."}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        required
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t.uploadPhoto}</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      {photo && (
                        <div className="mt-2 relative rounded overflow-hidden h-24 border">
                          <img src={photo} alt="Preview" className="object-cover w-full h-full" />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded text-xs transition duration-200"
                      disabled={submitting}
                    >
                      {submitting ? (language === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...') : t.fileReport}
                    </button>
                  </form>
                </div>
              )}

              {/* Active Issues and Map (Right) */}
              <div className={isStaff ? 'lg:col-span-3 space-y-6' : 'lg:col-span-2 space-y-6'}>
                {/* SVG MAP of Poochinayakkanpatti */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-subtle">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                    <Map className="h-4 w-4 text-primary-500" /> {t.interactiveWaterMap}
                  </h3>
                  <div className="h-48 bg-slate-50 dark:bg-slate-950 rounded-lg relative overflow-hidden border border-slate-100 dark:border-slate-800/40">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      {/* Streets Representation */}
                      <path d="M 20 100 Q 200 40 380 100" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-slate-800/60" />
                      <path d="M 50 180 Q 200 130 350 180" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-800/60" />
                      <path d="M 120 20 L 220 190" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-800/60" />
                      
                      {/* Reservoirs Pins */}
                      <circle cx="80" cy="70" r="10" className="fill-blue-500/80 stroke-white dark:stroke-slate-900 stroke-2 cursor-pointer" />
                      <text x="80" y="55" textAnchor="middle" className="text-[8px] font-bold fill-slate-700 dark:fill-slate-300">{language === 'ta' ? 'பூச்சினாயக்கன்பட்டி தொட்டி' : 'Poochinayakkanpatti Tank'}</text>

                      <circle cx="300" cy="110" r="10" className="fill-blue-500/80 stroke-white dark:stroke-slate-900 stroke-2 cursor-pointer" />
                      <text x="300" y="95" textAnchor="middle" className="text-[8px] font-bold fill-slate-700 dark:fill-slate-300">{language === 'ta' ? 'பழனி ரோடு தொட்டி' : 'Palani Rd Tank'}</text>

                      {/* Active Issues Red Pins */}
                      {issues.map((issue, idx) => (
                        <g key={issue.id}>
                          <circle
                            cx={120 + (idx * 60) % 150}
                            cy={80 + (idx * 40) % 90}
                            r="6"
                            className="fill-red-600 animate-ping"
                          />
                          <circle
                            cx={120 + (idx * 60) % 150}
                            cy={80 + (idx * 40) % 90}
                            r="5"
                            className="fill-red-500 stroke-white dark:stroke-slate-900 stroke-1 cursor-pointer"
                          />
                          <text
                            x={120 + (idx * 60) % 150}
                            y={70 + (idx * 40) % 90}
                            textAnchor="middle"
                            className="text-[7px] font-semibold fill-red-600 dark:fill-red-400"
                          >
                            {language === 'ta' ? 'கசிவு' : 'Leak'} #{issue.id}
                          </text>
                        </g>
                      ))}
                    </svg>
                    <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded border text-[9px] font-semibold flex gap-2">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 bg-blue-500 rounded-full"></span> {t.reservoirs}</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 bg-red-500 rounded-full"></span> {t.leaks}</span>
                    </div>
                  </div>
                </div>

                {/* Active Issues list */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {isStaff ? t.allWaterIncidents : t.yourWaterIncidents}
                  </h3>

                  {issues.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded p-6 text-center text-slate-500 text-xs">
                      {t.noIncidents}
                    </div>
                  ) : (
                    issues.map(issue => {
                      let badge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                      if (issue.status === 'Reported') badge = 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300';
                      else if (issue.status === 'Investigating') badge = 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-300';
                      else if (issue.status === 'In Progress') badge = 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-300';
                      else if (issue.status === 'Resolved') badge = 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300';

                      let issueTypeShow = issue.issue_type;
                      if (language === 'ta') {
                        if (issue.issue_type === 'Pipe Leakage') issueTypeShow = t.supplyPipelineLeakage;
                        else if (issue.issue_type === 'Water Scarcity') issueTypeShow = t.waterSupplyScarcity;
                        else if (issue.issue_type === 'Quality Contamination') issueTypeShow = t.waterContamination;
                        else if (issue.issue_type === 'Pumping Failure') issueTypeShow = t.pumpMotorFailure;
                      }

                      return (
                        <div key={issue.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {issueTypeShow} • ID #{issue.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badge}`}>
                              {language === 'ta' ? (issue.status === 'Reported' ? 'பதிவு செய்யப்பட்டது' : issue.status === 'Investigating' ? 'விசாரணையில்' : issue.status === 'In Progress' ? 'பழுதுபார்க்கப்படுகிறது' : 'தீர்க்கப்பட்டது') : issue.status}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500">
                            <strong>{language === 'ta' ? 'இடம்' : 'Location'}:</strong> {issue.location}
                            {isStaff && <span> • <strong>{language === 'ta' ? 'புகாரளித்தவர்' : 'Reported By'}:</strong> {issue.userName}</span>}
                          </div>

                          <p className="text-sm text-slate-700 dark:text-slate-300">{issue.description}</p>
                          
                          {issue.image_url && (
                            <div className="h-32 border rounded-lg overflow-hidden w-64 bg-slate-50 dark:bg-slate-950">
                              <img src={issue.image_url} alt="Leak Location" className="object-cover h-full w-full" />
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-2 gap-2">
                            <span>{language === 'ta' ? 'புகாரளிக்கப்பட்ட நாள்' : 'Reported'}: {new Date(issue.created_at).toLocaleString()}</span>
                            
                            {isStaff && issue.status !== 'Resolved' && (
                              <div className="flex gap-2">
                                {issue.status === 'Reported' && (
                                  <button
                                    onClick={() => updateIssueStatus(issue.id, 'Investigating')}
                                    className="px-2 py-1 bg-yellow-500 text-white rounded text-[10px] font-semibold hover:bg-yellow-600 transition"
                                  >
                                    {t.investigate}
                                  </button>
                                )}
                                {issue.status === 'Investigating' && (
                                  <button
                                    onClick={() => updateIssueStatus(issue.id, 'In Progress')}
                                    className="px-2 py-1 bg-orange-500 text-white rounded text-[10px] font-semibold hover:bg-orange-600 transition"
                                  >
                                    {t.deployRepair}
                                  </button>
                                )}
                                <button
                                  onClick={() => updateIssueStatus(issue.id, 'Resolved')}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-[10px] font-semibold hover:bg-green-700 transition"
                                >
                                  {t.closeTicket}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reservoirs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservoirs.map(res => {
                const cap = parseCapacityNum(res.capacity);
                const current = parseCapacityNum(res.current_level);
                const percent = Math.round((current / cap) * 100);

                let resName = res.name;
                let resLoc = res.location;
                if (language === 'ta') {
                  if (res.name === 'Poochinayakkanpatti Tank') resName = 'பூச்சினாயக்கன்பட்டி நீர் தொட்டி';
                  else if (res.name === 'Palani Rd Reservoir') resName = 'பழனி ரோடு நீர் தேக்கம்';
                  if (res.location === 'Poochinayakkanpatti Dindigul') resLoc = 'பூச்சினாயக்கன்பட்டி, திண்டுக்கல்';
                  else if (res.location === 'Palani Bypass Road Dindigul') resLoc = 'பழனி பைபாஸ் ரோடு, திண்டுக்கல்';
                }

                return (
                  <div key={res.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{resName}</h3>
                      <span className="text-xs text-slate-400">{resLoc}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">{t.currentVolume}: {language === 'ta' ? res.current_level.replace(' Liters', ' லிட்டர்') : res.current_level}</span>
                        <span className="text-primary-600">{percent}% {language === 'ta' ? 'நிறைந்துள்ளது' : 'Full'}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-slate-400 text-right">
                        {t.totalCapacity}: {language === 'ta' ? res.capacity.replace(' Liters', ' லிட்டர்') : res.capacity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
