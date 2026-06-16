import React, { useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = 'https://wet360.onrender.com/';
import { 
  LayoutDashboard, Sparkles, Sprout, Droplets, Heart, HelpCircle, 
  Briefcase, BookOpen, Calendar, MessageSquare, Settings, Sun, 
  Moon, LogOut, LogIn, Menu, X, Bell, Award
} from 'lucide-react';

// Import translations
import { translations, Language } from './translations';

// Import sub-views
import DashboardView from './views/DashboardView';
import SchemeFinderView from './views/SchemeFinderView';
import AgricultureSupportView from './views/AgricultureSupportView';
import WaterResourceView from './views/WaterResourceView';
import WomenEmpowermentView from './views/WomenEmpowermentView';
import HelpDeskView from './views/HelpDeskView';
import JobBoardView from './views/JobBoardView';
import LearningCenterView from './views/LearningCenterView';
import EventsCalendarView from './views/EventsCalendarView';
import FeedbackView from './views/FeedbackView';
import StoriesHubView from './views/StoriesHubView';
import ContributionsView from './views/ContributionsView';
import AdminPortalView from './views/AdminPortalView';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function App() {
  const [token, setToken] = useState<string>(localStorage.getItem('token') || '');
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('language') as Language) || 'en'
  );
  
  // Navigation states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Auth flow states
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Form inputs
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Demographics
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [location, setLocation] = useState('Poochinayakkanpatti');
  const [occupation, setOccupation] = useState('Tailoring');
  const [income, setIncome] = useState('');
  const [education, setEducation] = useState('12th Standard');
  const [farmerStatus, setFarmerStatus] = useState(false);
  const [shgMembership, setSHGMembership] = useState(false);

  useEffect(() => {
    // Apply theme on load
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = translations[language];

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const markNotificationRead = async (id: number) => {
    try {
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await axios.post('/api/auth/login', {
        usernameOrEmail: email,
        password
      });
      const data = res.data;
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Invalid credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await axios.post('/api/auth/register', {
        name,
        email,
        username,
        password,
        age: age ? parseInt(age) : null,
        gender,
        location,
        occupation,
        income: income ? parseFloat(income) : null,
        education,
        farmer_status: farmerStatus,
        shg_membership: shgMembership
      });
      
      // Auto login
      const loginRes = await axios.post('/api/auth/login', {
        usernameOrEmail: username,
        password
      });
      const data = loginRes.data;
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // reset forms
      setName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setAge('');
      setIsRegistering(false);
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Registration failed.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('dashboard');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const sidebarItems = [
    { id: 'dashboard', name: t.dashboard, icon: LayoutDashboard },
    { id: 'schemes', name: t.schemes, icon: Sparkles },
    { id: 'agriculture', name: t.agriculture, icon: Sprout },
    { id: 'water', name: t.water, icon: Droplets },
    { id: 'women', name: t.women, icon: Heart },
    { id: 'helpdesk', name: t.helpdesk, icon: HelpCircle },
    { id: 'jobs', name: t.jobs, icon: Briefcase },
    { id: 'learning', name: t.learning, icon: BookOpen },
    { id: 'events', name: t.events, icon: Calendar },
    { id: 'feedback', name: t.feedback, icon: MessageSquare },
    { id: 'stories', name: t.stories, icon: Heart },
    { id: 'contributions', name: t.contributions, icon: Award }
  ];

  // Restrict Admin settings role check
  const isAdmin = user?.role === 'Admin';
  const isStaff = user?.role === 'Staff' || isAdmin;

  const getInitials = (n: string) => {
    return n.split(' ').map(s => s[0]).join('').substring(0, 2).toUpperCase();
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 left-0 z-40 w-64 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-300 md:translate-x-0 flex flex-col justify-between ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          {/* Brand */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800/80">
            <span className="font-display font-extrabold text-lg tracking-tight text-primary-600 dark:text-primary-500 flex items-center gap-1.5">
              🌱 WET360
            </span>
            <button className="md:hidden text-slate-500" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition duration-200 ${currentView === item.id ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}

            {isStaff && (
              <button
                onClick={() => {
                  setCurrentView('admin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition duration-200 border border-dashed border-slate-200 dark:border-slate-800 ${currentView === 'admin' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Settings className="h-4 w-4" />
                <span>Admin Settings</span>
              </button>
            )}
          </nav>
        </div>

        {/* Profile Card Section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-primary-600 dark:bg-primary-700 text-white rounded-full flex items-center justify-center font-bold text-xs">
                  {getInitials(user.name)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 py-1.5 rounded text-xs font-semibold transition"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <p className="text-[11px] text-slate-500">Log in to apply for schemes & report water issues.</p>
              <button
                onClick={() => setIsRegistering(false)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Contents Panel */}
      <div className="flex-grow flex flex-col md:pl-0 min-w-0">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.tagline}</span>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.headOffice}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              className="px-2.5 py-1 text-xs font-bold rounded border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition duration-150"
            >
              {language === 'en' ? 'தமிழ்' : 'English'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>

            {/* Notifications Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 rounded border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 relative"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-red-500 h-2 w-2 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 p-3 space-y-2 text-xs">
                    <h3 className="font-bold border-b pb-1.5 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                      Notifications ({unreadNotifications.length})
                    </h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <div className="text-center py-4 text-slate-400">No alerts at this time.</div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationRead(n.id)}
                            className={`p-2 rounded cursor-pointer transition ${n.is_read ? 'opacity-60 bg-transparent' : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80'}`}
                          >
                            <div className="font-bold text-slate-800 dark:text-slate-200">{n.title}</div>
                            <div className="text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Dynamic view router mounting */}
        <main className="flex-grow p-6 overflow-y-auto">
          {!user && (currentView !== 'dashboard' && currentView !== 'schemes' && currentView !== 'learning' && currentView !== 'events' && currentView !== 'stories' && currentView !== 'contributions') ? (
            
            /* Auth Panels if guest accesses locked tab */
            <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xl space-y-4">
              {!isRegistering ? (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-4 text-sm">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Sign In to WET360</h2>
                    <p className="text-xs text-slate-500">Access your saved schemes, log water leaks, and request farming visits.</p>
                  </div>

                  {authError && <div className="p-2.5 bg-red-50 text-red-700 rounded text-xs font-semibold">{authError}</div>}

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Username or Email Address</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded bg-transparent"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
                    <input
                      type="password"
                      className="w-full border p-2 rounded bg-transparent"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded transition"
                  >
                    Sign In
                  </button>

                  <div className="text-center text-xs text-slate-400 pt-2 border-t">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => setIsRegistering(true)} className="text-primary-600 font-semibold hover:underline">
                      Sign Up
                    </button>
                  </div>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegister} className="space-y-4 text-sm">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create Citizen Profile</h2>
                    <p className="text-xs text-slate-500">Provide details so our matching engine can search relevant welfare schemes.</p>
                  </div>

                  {authError && <div className="p-2 bg-red-50 text-red-700 rounded text-xs font-semibold">{authError}</div>}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                      <input
                        type="text"
                        className="w-full border p-2 rounded bg-transparent"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Username</label>
                      <input
                        type="text"
                        className="w-full border p-2 rounded bg-transparent"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                      <input
                        type="email"
                        className="w-full border p-2 rounded bg-transparent"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
                      <input
                        type="password"
                        className="w-full border p-2 rounded bg-transparent"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t border-dashed pt-3">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Demographic Survey (For Schemes Recommender)</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Age</label>
                        <input
                          type="number"
                          className="w-full border p-2 rounded bg-transparent"
                          value={age}
                          onChange={e => setAge(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
                        <select
                          className="w-full border p-2 rounded bg-transparent"
                          value={gender}
                          onChange={e => setGender(e.target.value)}
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Location</label>
                        <input
                          type="text"
                          className="w-full border p-2 rounded bg-transparent"
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Occupation</label>
                        <input
                          type="text"
                          className="w-full border p-2 rounded bg-transparent"
                          value={occupation}
                          onChange={e => setOccupation(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Annual Income (₹)</label>
                        <input
                          type="number"
                          className="w-full border p-2 rounded bg-transparent"
                          value={income}
                          onChange={e => setIncome(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Education</label>
                        <input
                          type="text"
                          className="w-full border p-2 rounded bg-transparent"
                          value={education}
                          onChange={e => setEducation(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 mt-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={farmerStatus}
                          onChange={e => setFarmerStatus(e.target.checked)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs text-slate-500">I am a land farmer</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shgMembership}
                          onChange={e => setSHGMembership(e.target.checked)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs text-slate-500">I am in an SHG</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded transition"
                  >
                    Submit & Register
                  </button>

                  <div className="text-center text-xs text-slate-400 pt-2 border-t">
                    Already registered?{' '}
                    <button type="button" onClick={() => setIsRegistering(false)} className="text-primary-600 font-semibold hover:underline">
                      Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            
            /* Mounted Active Sub-View Panels */
            <>
              {currentView === 'dashboard' && <DashboardView token={token} language={language} />}
              {currentView === 'schemes' && <SchemeFinderView token={token} userProfile={user} language={language} />}
              {currentView === 'agriculture' && <AgricultureSupportView token={token} userRole={user?.role || null} language={language} />}
              {currentView === 'water' && <WaterResourceView token={token} userRole={user?.role || null} language={language} />}
              {currentView === 'women' && <WomenEmpowermentView token={token} language={language} />}
              {currentView === 'helpdesk' && <HelpDeskView token={token} userRole={user?.role || null} language={language} />}
              {currentView === 'jobs' && <JobBoardView token={token} userRole={user?.role || null} language={language} />}
              {currentView === 'learning' && <LearningCenterView language={language} />}
              {currentView === 'events' && <EventsCalendarView token={token} language={language} />}
              {currentView === 'feedback' && <FeedbackView token={token} language={language} />}
              {currentView === 'stories' && <StoriesHubView language={language} />}
              {currentView === 'contributions' && <ContributionsView token={token} language={language} />}
              {currentView === 'admin' && isStaff && <AdminPortalView token={token} language={language} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
