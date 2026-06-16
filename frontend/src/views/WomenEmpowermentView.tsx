import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Heart, PlusCircle, CheckCircle, GraduationCap, Building2, HelpCircle, Calendar } from 'lucide-react';
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

interface Enrollment {
  id: number;
  shg_name: string;
  role: string;
  enrollment_date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function WomenEmpowermentView({ token, language }: { token: string; language?: Language }) {
  const t = translations[language || 'en'];
  const [activeTab, setActiveTab] = useState<'programs' | 'shg'>('programs');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // SHG Form state
  const [shgName, setShgName] = useState('Dindigul Magalir Sangam');
  const [role, setRole] = useState('Member');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const progRes = await axios.get('/api/women/programs');
      // Filter training programs to only show Women Development
      setPrograms(progRes.data.filter((p: Program) => p.category === 'Women Development'));

      if (token) {
        // Fetch user's registrations/enrollments
        // Since we don't have separate GET for enrollments, we can mock it from db seeds or query if exists
        // Let's call /api/auth/me or a simulated list
        const res = await axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.shg_membership) {
          setEnrollments([
            { id: 1, shg_name: 'Dindigul Magalir Sangam', role: 'Treasurer', enrollment_date: '2026-05-10', status: 'Approved' }
          ]);
        }
      }
    } catch (e) {
      console.error('Error fetching women center data', e);
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
      alert('Successfully registered for the tailoring course!');
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Registration failed.');
    }
  };

  const enrollSHG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in to submit SHG enrollments.');
      return;
    }
    setEnrolling(true);
    try {
      await axios.post('/api/women/shg/enroll', { shg_name: shgName, role }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('SHG enrollment submitted successfully! Pending verification.');
      setEnrollments([
        ...enrollments,
        { id: Math.random(), shg_name: shgName, role, enrollment_date: new Date().toISOString().split('T')[0], status: 'Pending' }
      ]);
    } catch (err) {
      console.error(err);
      alert('Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            {t.womenTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.womenTagline}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${activeTab === 'programs' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Calendar className="h-3.5 w-3.5" /> {t.livelihoodCourses}
          </button>
          <button
            onClick={() => setActiveTab('shg')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${activeTab === 'shg' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Building2 className="h-3.5 w-3.5" /> {t.shgEnrollment}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{language === 'ta' ? 'பெண்கள் மேம்பாட்டு மையத் தரவுகளை ஏற்றுகிறது...' : 'Loading empowerment programs...'}</div>
      ) : (
        <>
          {activeTab === 'programs' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {programs.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-500 border border-dashed rounded-lg">
                  {language === 'ta' ? 'செயலில் உள்ள வகுப்புகள் எதுவும் பட்டியலிடப்படவில்லை.' : 'No active courses listed. Check back soon.'}
                </div>
              ) : (
                programs.map(prog => (
                  <div key={prog.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 bg-pink-50 dark:bg-pink-950/40 px-2.5 py-0.5 rounded">
                          {language === 'ta' ? 'பெண்கள் மேம்பாடு' : prog.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          {prog.registered_count} / {prog.capacity} {language === 'ta' ? 'பதிவுசெய்துள்ளனர்' : 'Enrolled'}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{prog.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{prog.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <div><strong>{language === 'ta' ? 'பயிற்சியாளர்' : 'Instructor'}:</strong> {prog.instructor}</div>
                      <div><strong>{language === 'ta' ? 'தொடங்கும் நாள்' : 'Starts'}:</strong> {prog.date}</div>
                      <div className="col-span-2"><strong>{language === 'ta' ? 'இடம்' : 'Location'}:</strong> {prog.location}</div>
                    </div>

                    <button
                      onClick={() => registerProgram(prog.id)}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded text-xs transition duration-200"
                      disabled={prog.registered_count >= prog.capacity}
                    >
                      {prog.registered_count >= prog.capacity 
                        ? (language === 'ta' ? 'வகுப்பு முடிந்தது' : 'Class Full') 
                        : t.enrollTrainingCourse}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'shg' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form (Left) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-subtle lg:col-span-1 h-fit">
                <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                  <PlusCircle className="h-5 w-5 text-pink-500" /> {t.applySHG}
                </h2>
                <form onSubmit={enrollSHG} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t.targetSHG}</label>
                    <select
                      value={shgName}
                      onChange={e => setShgName(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="Dindigul Magalir Sangam">Dindigul Magalir Sangam</option>
                      <option value="Poochinayakkanpatti Mother Trust">Poochinayakkanpatti Mother Trust</option>
                      <option value="Kalaignar Women Group">Kalaignar Women Group</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t.requestedRole}</label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="Member">{language === 'ta' ? 'பொது உறுப்பினர்' : 'General Member'}</option>
                      <option value="Treasurer">{language === 'ta' ? 'குழு பொருளாளர்' : 'Group Treasurer'}</option>
                      <option value="President">{language === 'ta' ? 'குழு தலைவர்' : 'Group President'}</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded text-xs transition duration-200"
                    disabled={enrolling}
                  >
                    {enrolling ? (language === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...') : (language === 'ta' ? 'SHG குழுவில் பதிவு செய்' : 'Register for SHG')}
                  </button>
                </form>
              </div>

              {/* Status List (Right) */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">
                  {t.yourSHGMemberships}
                </h2>

                {enrollments.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-500 text-sm">
                    {t.noSHG}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrollments.map(enroll => {
                      let badge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                      if (enroll.status === 'Pending') badge = 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-300';
                      else if (enroll.status === 'Approved') badge = 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300';

                      let roleShow = enroll.role;
                      if (language === 'ta') {
                        if (enroll.role === 'Member') roleShow = 'பொது உறுப்பினர்';
                        else if (enroll.role === 'Treasurer') roleShow = 'குழு பொருளாளர்';
                        else if (enroll.role === 'President') roleShow = 'குழு தலைவர்';
                      }

                      return (
                        <div key={enroll.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-md">
                              {language === 'ta' ? enroll.shg_name.replace('Magalir Sangam', 'மகளிர் சங்கம்').replace('Mother Trust', 'அன்னை அறக்கட்டளை').replace('Women Group', 'பெண்கள் குழு') : enroll.shg_name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badge}`}>
                              {language === 'ta' ? (enroll.status === 'Pending' ? 'விசாரணையில்' : 'அங்கீகரிக்கப்பட்டது') : enroll.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 space-y-1">
                            <div><strong>{t.assignedRole}:</strong> {roleShow}</div>
                            <div><strong>{t.enrollmentDate}:</strong> {enroll.enrollment_date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
