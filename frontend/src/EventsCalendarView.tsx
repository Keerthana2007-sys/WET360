import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, MapPin, User, Bell, CheckCircle } from 'lucide-react';
import { translations, Language } from '../translations';

interface Event {
  id: number;
  title: string;
  description: string;
  category: string;
  event_date: string;
  location: string;
  organizer: string;
}

export default function EventsCalendarView({ token, language }: { token: string; language?: Language }) {
  const t = translations[language || 'en'];
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredIds, setRegisteredIds] = useState<number[]>([]);

  useEffect(() => {
    fetchEvents();
  }, [token]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/events');
      setEvents(res.data);
      
      // If user is logged in, mock some registrations or fetch if endpoints exist
      // Since it's local demonstration, let's just keep registration in state
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const registerEvent = async (id: number) => {
    if (!token) {
      alert('Please log in to register for campaigns.');
      return;
    }
    try {
      await axios.post(`/api/events/${id}/register`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Registered successfully! An event reminder notification was set.');
      setRegisteredIds([...registeredIds, id]);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary-500" />
          {t.eventsTitle}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.eventsTagline}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{language === 'ta' ? 'நிகழ்வுகளை ஏற்றுகிறது...' : 'Loading calendar events...'}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg">
          {t.noEvents}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(event => {
            const registered = registeredIds.includes(event.id);
            let catColor = 'text-primary-700 bg-primary-50 dark:bg-primary-950/40';
            if (event.category.includes('Water')) catColor = 'text-blue-700 bg-blue-50 dark:bg-blue-950/40';
            else if (event.category.includes('Women')) catColor = 'text-pink-700 bg-pink-50 dark:bg-pink-950/40';

            let catLabel = event.category;
            if (language === 'ta') {
              if (event.category === 'Water Conservation Campaign') catLabel = 'நீர் பாதுகாப்பு பிரச்சாரம்';
              else if (event.category === 'Agriculture Workshop') catLabel = 'விவசாய பட்டறை';
              else if (event.category === 'Skill Development Drive') catLabel = 'திறன் வளர்ச்சி முகாம்';
            }

            return (
              <div key={event.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${catColor}`}>
                      {catLabel}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{event.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{event.description}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-slate-400" /> {event.event_date}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {event.location}</div>
                  <div className="flex items-center gap-1.5"><User className="h-4 w-4 text-slate-400" /> {language === 'ta' ? 'அமைப்பாளர்' : 'Organizer'}: {event.organizer}</div>
                </div>

                <button
                  onClick={() => registerEvent(event.id)}
                  className={`w-full font-semibold py-2 rounded text-xs transition duration-200 flex items-center justify-center gap-1 ${registered ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'}`}
                >
                  {registered ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" /> {t.registeredReminder}
                    </>
                  ) : (
                    <>
                      <Bell className="h-3.5 w-3.5" /> {t.registerReminderBtn}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
