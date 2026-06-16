import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HelpCircle, PlusCircle, FileText, CheckCircle, Clock, Send } from 'lucide-react';
import { translations, Language } from '../translations';

interface HelpRequest {
  id: number;
  user_id: number;
  category: string;
  subject: string;
  description: string;
  attachment_url: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  created_at: string;
  userName?: string;
}

export default function HelpDeskView({ token, userRole, language }: { token: string; userRole: string | null; language?: Language }) {
  const t = translations[language || 'en'];
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [category, setCategory] = useState('Welfare Support');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Agriculture Assistance',
    'Water Issues',
    'Welfare Support',
    'Employment Support',
    'Training Requests',
    'SHG Support'
  ];

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/help-desk/requests', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setRequests(res.data);
    } catch (e) {
      console.error('Error fetching help requests', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in to log a ticket.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/help-desk/requests', {
        category,
        subject,
        description,
        attachment_url: attachment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Help desk ticket submitted successfully!');
      setSubject('');
      setDescription('');
      setAttachment('');
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateTicketStatus = async (id: number, newStatus: string) => {
    try {
      await axios.put(`/api/help-desk/requests/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Status updated successfully!');
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  const isStaff = userRole === 'Admin' || userRole === 'Staff';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary-500" />
          {t.helpTitle}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.helpTagline}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{language === 'ta' ? 'உதவி மையப் பதிவுகளை ஏற்றுகிறது...' : 'Loading help desk logs...'}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form (Left) */}
          {!isStaff && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-subtle lg:col-span-1 h-fit">
              <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-primary-500" /> {t.logSupportTicket}
              </h2>
              <form onSubmit={submitTicket} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.supportCategory}</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {categories.map(cat => {
                      let catLabel = cat;
                      if (language === 'ta') {
                        if (cat === 'Agriculture Assistance') catLabel = 'விவசாய உதவி';
                        else if (cat === 'Water Issues') catLabel = 'குடிநீர் சிக்கல்கள்';
                        else if (cat === 'Welfare Support') catLabel = 'நலத்திட்ட உதவி';
                        else if (cat === 'Employment Support') catLabel = 'வேலைவாய்ப்பு உதவி';
                        else if (cat === 'Training Requests') catLabel = 'பயிற்சி கோரிக்கைகள்';
                        else if (cat === 'SHG Support') catLabel = 'சுயஉதவிக்குழு உதவி';
                      }
                      return <option key={cat} value={cat}>{catLabel}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.subjectSummary}</label>
                  <input
                    type="text"
                    placeholder={language === 'ta' ? 'எ.கா. கல்வி உதவித்தொகை தாமதம்' : "e.g. Scholarship application delay"}
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.explainDetails}</label>
                  <textarea
                    rows={4}
                    placeholder={language === 'ta' ? 'பிரச்சனை அல்லது கோரிக்கையை தெளிவாக விளக்குங்கள்...' : "Explain the problem or request clearly..."}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.attachment}</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded text-xs transition duration-200 flex items-center justify-center gap-1.5"
                  disabled={submitting}
                >
                  <Send className="h-3.5 w-3.5" /> {submitting ? (language === 'ta' ? 'அனுப்புகிறது...' : 'Sending...') : t.submitTicket}
                </button>
              </form>
            </div>
          )}

          {/* Tickets Log List (Right) */}
          <div className={isStaff ? 'lg:col-span-3 space-y-4' : 'lg:col-span-2 space-y-4'}>
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">
              {isStaff ? t.allSupportTickets : t.yourSupportTickets}
            </h2>

            {requests.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-500 text-sm">
                {t.noTickets}
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => {
                  let statusBadge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  if (req.status === 'In Progress') statusBadge = 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-300';
                  else if (req.status === 'Resolved') statusBadge = 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300';

                  let catLabelShow = req.category;
                  if (language === 'ta') {
                    if (req.category === 'Agriculture Assistance') catLabelShow = 'விவசாய உதவி';
                    else if (req.category === 'Water Issues') catLabelShow = 'குடிநீர் சிக்கல்கள்';
                    else if (req.category === 'Welfare Support') catLabelShow = 'நலத்திட்ட உதவி';
                    else if (req.category === 'Employment Support') catLabelShow = 'வேலைவாய்ப்பு உதவி';
                    else if (req.category === 'Training Requests') catLabelShow = 'பயிற்சி கோரிக்கைகள்';
                    else if (req.category === 'SHG Support') catLabelShow = 'சுயஉதவிக்குழு உதவி';
                  }

                  return (
                    <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {catLabelShow} • Ticket #{req.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadge}`}>
                          {language === 'ta' ? (req.status === 'Pending' ? 'விசாரணையில்' : req.status === 'In Progress' ? 'பரிசீலனையில்' : 'தீர்க்கப்பட்டது') : req.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{req.subject}</h3>
                      
                      {isStaff && (
                        <div className="text-xs text-slate-500">
                          <strong>{language === 'ta' ? 'கோரியவர்' : 'Requested By'}:</strong> {req.userName}
                        </div>
                      )}

                      <p className="text-sm text-slate-700 dark:text-slate-300">{req.description}</p>
                      
                      {req.attachment_url && (
                        <div className="h-32 border rounded-lg overflow-hidden w-64 bg-slate-50 dark:bg-slate-950">
                          <img src={req.attachment_url} alt="Attachment Document" className="object-cover h-full w-full" />
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-2 gap-2">
                        <span>{language === 'ta' ? 'சமர்ப்பிக்கப்பட்ட நாள்' : 'Submitted'}: {new Date(req.created_at).toLocaleString()}</span>
                        
                        {isStaff && req.status !== 'Resolved' && (
                          <div className="flex gap-2">
                            {req.status === 'Pending' && (
                              <button
                                onClick={() => updateTicketStatus(req.id, 'In Progress')}
                                className="px-2.5 py-1 bg-orange-500 text-white rounded text-[10px] font-semibold hover:bg-orange-600 transition"
                              >
                                {t.acceptTicket}
                              </button>
                            )}
                            <button
                              onClick={() => updateTicketStatus(req.id, 'Resolved')}
                              className="px-2.5 py-1 bg-green-600 text-white rounded text-[10px] font-semibold hover:bg-green-700 transition"
                            >
                              {t.resolveTicket}
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
    </div>
  );
}
