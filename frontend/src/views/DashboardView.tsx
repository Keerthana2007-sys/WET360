import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { LayoutDashboard, Users, HelpCircle, CheckCircle, MapPin, Sprout, Droplets, GraduationCap } from 'lucide-react';
import { translations, Language } from '../translations';

Chart.register(...registerables);

interface VillageStats {
  villagesCovered: number;
  membersRegistered: number;
  requestsResolved: number;
  agricultureProgramsConducted: number;
  waterActivitiesConducted: number;
  trainingProgramsOrganized: number;
  participationRate: string;
}

export default function DashboardView({ token, language }: { token: string; language?: Language }) {
  const [stats, setStats] = useState<VillageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef1 = useRef<HTMLCanvasElement | null>(null);
  const chartRef2 = useRef<HTMLCanvasElement | null>(null);
  const chartInstance1 = useRef<Chart | null>(null);
  const chartInstance2 = useRef<Chart | null>(null);

  const t = translations[language || 'en'];

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get('/api/dashboard/village', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setStats(res.data);
      } catch (e) {
        console.error('Error fetching village stats', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [token]);

  useEffect(() => {
    if (!stats) return;

    // Destroy existing charts
    if (chartInstance1.current) chartInstance1.current.destroy();
    if (chartInstance2.current) chartInstance2.current.destroy();

    // Chart 1: Programs & Activities
    if (chartRef1.current) {
      chartInstance1.current = new Chart(chartRef1.current, {
        type: 'bar',
        data: {
          labels: [t.agriWorkshops, t.waterCampaigns, t.skillSessions],
          datasets: [{
            label: t.conductedEvents,
            data: [
              stats.agricultureProgramsConducted,
              stats.waterActivitiesConducted,
              stats.trainingProgramsOrganized
            ],
            backgroundColor: [
              'rgba(22, 163, 74, 0.75)', // Agri - Green
              'rgba(2, 132, 199, 0.75)',  // Water - Blue
              'rgba(147, 51, 234, 0.75)'  // Skill - Purple
            ],
            borderColor: [
              'rgb(22, 163, 74)',
              'rgb(2, 132, 199)',
              'rgb(147, 51, 234)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      });
    }

    // Chart 2: Community Participation
    if (chartRef2.current) {
      chartInstance2.current = new Chart(chartRef2.current, {
        type: 'doughnut',
        data: {
          labels: [t.resolvedIssues, t.pendingIssues],
          datasets: [{
            data: [stats.requestsResolved, Math.max(1, 10 - stats.requestsResolved)],
            backgroundColor: [
              'rgba(22, 163, 74, 0.75)', // Resolved - Green
              'rgba(249, 115, 22, 0.75)'  // Pending - Orange
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }

    return () => {
      if (chartInstance1.current) chartInstance1.current.destroy();
      if (chartInstance2.current) chartInstance2.current.destroy();
    };
  }, [stats, language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 animate-pulse">{language === 'ta' ? 'அளவீடுகளை ஏற்றுகிறது...' : 'Loading dashboard metrics...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary-500" />
          {t.dashboard}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {language === 'ta' ? 'திண்டுக்கல் வட்டாரத்திற்கான நிகழ்நேர அளவீடுகள் மற்றும் தாக்க பகுப்பாய்வு.' : 'Real-time metrics and welfare analytics for Dindigul region.'}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.villages}</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats?.villagesCovered}</h3>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-primary-600 rounded">
            <MapPin className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.members}</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats?.membersRegistered}</h3>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.resolved}</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats?.requestsResolved}</h3>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950/30 text-purple-600 rounded">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.rate}</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats?.participationRate}</h3>
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-950/30 text-orange-600 rounded">
            <HelpCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Village Development Dashboard Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-subtle">
        <h2 className="text-lg font-bold font-display text-slate-800 dark:text-slate-200 mb-4 border-b pb-2 border-slate-100 dark:border-slate-800">
          {t.progressTracker}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Agri Conducted */}
          <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
            <div className="p-3 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-full">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{language === 'ta' ? 'விவசாயப் பட்டறைகள்' : 'Agricultural Workshops'}</h4>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats?.agricultureProgramsConducted}</p>
              <span className="text-xs text-slate-500">{language === 'ta' ? 'வட்டாரத்தில் நடத்தப்பட்டவை' : 'Conducted locally'}</span>
            </div>
          </div>

          {/* Water Conducted */}
          <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
            <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{language === 'ta' ? 'நீர் பாதுகாப்பு பிரச்சாரங்கள்' : 'Water Conservation Drives'}</h4>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats?.waterActivitiesConducted}</p>
              <span className="text-xs text-slate-500">{t.activeCampaigns}</span>
            </div>
          </div>

          {/* Skill Conducted */}
          <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
            <div className="p-3 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{language === 'ta' ? 'தொழில் திறன் பயிற்சிகள்' : 'Skill Trainings Organised'}</h4>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats?.trainingProgramsOrganized}</p>
              <span className="text-xs text-slate-500">{t.enrollmentActive}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-subtle">
          <h3 className="text-md font-bold font-display text-slate-800 dark:text-slate-200 mb-4">
            {t.activitiesComparison}
          </h3>
          <div className="h-64 relative">
            <canvas ref={chartRef1}></canvas>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-subtle">
          <h3 className="text-md font-bold font-display text-slate-800 dark:text-slate-200 mb-4">
            {t.satisfactionDistribution}
          </h3>
          <div className="h-64 relative">
            <canvas ref={chartRef2}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
