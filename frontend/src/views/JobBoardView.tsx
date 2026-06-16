import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Briefcase, Building2, MapPin, Calendar, ExternalLink, Trash2 } from 'lucide-react';
import { translations, Language } from '../translations';

interface Opportunity {
  id: number;
  title: string;
  type: 'Job' | 'Training' | 'Volunteer' | 'Internship' | 'Entrepreneurship';
  organization: string;
  location: string;
  description: string;
  requirements: string;
  benefits: string;
  application_url: string;
  deadline: string;
}

export default function JobBoardView({ token, userRole, language }: { token: string; userRole: string | null; language?: Language }) {
  const t = translations[language || 'en'];
  const [jobs, setJobs] = useState<Opportunity[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [filterType]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/jobs');
      if (filterType) {
        setJobs(res.data.filter((j: Opportunity) => j.type === filterType));
      } else {
        setJobs(res.data);
      }
    } catch (e) {
      console.error('Error fetching jobs', e);
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this opportunity?')) return;
    try {
      await axios.delete(`/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Opportunity removed successfully.');
      fetchJobs();
    } catch (e) {
      console.error(e);
      alert('Deletion failed.');
    }
  };

  const types = ['Job', 'Training', 'Volunteer', 'Internship', 'Entrepreneurship'];
  const isAdmin = userRole === 'Admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary-500" />
            {t.jobTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.jobTagline}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-1 text-xs font-semibold rounded ${filterType === '' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t.allOps}
          </button>
          {types.map(typeOpt => {
            let typeLabel = typeOpt;
            if (language === 'ta') {
              if (typeOpt === 'Job') typeLabel = 'வேலை';
              else if (typeOpt === 'Training') typeLabel = 'பயிற்சி';
              else if (typeOpt === 'Volunteer') typeLabel = 'தன்னார்வம்';
              else if (typeOpt === 'Internship') typeLabel = 'இன்டர்ன்ஷிப்';
              else if (typeOpt === 'Entrepreneurship') typeLabel = 'தொழில்முனைவோர்';
            }
            return (
              <button
                key={typeOpt}
                onClick={() => setFilterType(typeOpt)}
                className={`px-3 py-1 text-xs font-semibold rounded ${filterType === typeOpt ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {typeLabel}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{language === 'ta' ? 'வேலைவாய்ப்புகளை ஏற்றுகிறது...' : 'Loading opportunity board...'}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg">
          {t.noJobs}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobs.map(job => {
            let typeBadge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            if (job.type === 'Job') typeBadge = 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900';
            else if (job.type === 'Internship') typeBadge = 'bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900';
            else if (job.type === 'Volunteer') typeBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900';
            else if (job.type === 'Training') typeBadge = 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-900';

            let typeShow: string = job.type;
            if (language === 'ta') {
              if (job.type === 'Job') typeShow = 'வேலை';
              else if (job.type === 'Training') typeShow = 'திறன் பயிற்சி';
              else if (job.type === 'Volunteer') typeShow = 'தன்னார்வம்';
              else if (job.type === 'Internship') typeShow = 'இன்டர்ன்ஷிப்';
              else if (job.type === 'Entrepreneurship') typeShow = 'தொழில்முனைவு';
            }

            return (
              <div key={job.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${typeBadge}`}>
                        {typeShow}
                      </span>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mt-1.5">{job.title}</h3>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {job.organization}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 pt-1">{job.description}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500">
                  <div><strong>{t.requirements}:</strong> {job.requirements}</div>
                  <div><strong>{t.benefitsLabel}:</strong> {job.benefits}</div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {t.deadline}: {job.deadline}
                  </span>
                  <a
                    href={job.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:underline"
                  >
                    {t.applyNow} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
