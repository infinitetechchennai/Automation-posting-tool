import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { api, CalendarItem } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

type CalendarViewMode = 'month' | 'week' | 'day';

export const ContentCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Reschedule Modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarItem | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('10:00');
  const [rescheduling, setRescheduling] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const items = await api.getCalendarEvents(platformFilter, statusFilter);
      setEvents(items);
    } catch (err: any) {
      toast.error('Failed to load calendar events', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [platformFilter, statusFilter]);

  // Navigate calendar dates
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
    else if (viewMode === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleCancelPost = async (id: number) => {
    if (!window.confirm('Cancel this scheduled post?')) return;
    try {
      await api.cancelPlatformPost(id);
      toast.info('Scheduled post cancelled');
      loadEvents();
    } catch (err: any) {
      toast.error('Cancel Failed', err.message);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedEvent) return;
    setRescheduling(true);
    try {
      const combined = new Date(`${newScheduleDate}T${newScheduleTime}:00`);
      await api.rescheduleCalendarEvent(selectedEvent.id, combined.toISOString());
      toast.success('Post Rescheduled!');
      setSelectedEvent(null);
      loadEvents();
    } catch (err: any) {
      toast.error('Reschedule Failed', err.message);
    } finally {
      setRescheduling(false);
    }
  };

  // Month Grid Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    daysArray.push(new Date(year, month, d));
  }

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => {
      const target = e.scheduled_at || e.published_at;
      return target && target.startsWith(dateStr);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Social Content Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize your publication queue across Monthly, Weekly, and Daily schedules with live timezone synchronization.
          </p>
        </div>

        {/* View Mode Toggle Mandated by Section 14 */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            {(['month', 'week', 'day'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/create-post')}
          >
            Create Post
          </Button>
        </div>
      </div>

      {/* Date Navigator & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-extrabold text-sm md:text-base text-slate-900 dark:text-slate-100 min-w-[180px] text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs font-semibold text-indigo-600 hover:underline px-2"
          >
            Today
          </button>
        </div>

        {/* Filter Selectors Mandated by Section 14 */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">X (Twitter)</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
            <option value="draft">Draft</option>
          </select>

          <button
            onClick={loadEvents}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center py-2.5">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {daysArray.map((date, idx) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[110px] bg-slate-50/30 dark:bg-slate-950/20 p-2"
                  />
                );
              }

              const dayEvents = getEventsForDay(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[110px] p-2 flex flex-col justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition ${
                    isToday ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        {dayEvents.length} post{dayEvents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Day Events list */}
                  <div className="space-y-1 overflow-y-auto max-h-24">
                    {dayEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          setSelectedEvent(ev);
                          setNewScheduleDate(date.toISOString().split('T')[0]);
                        }}
                        className={`p-1.5 rounded-lg border text-[10px] cursor-pointer hover:shadow transition flex items-center justify-between gap-1 ${
                          ev.status === 'published'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                            : ev.status === 'failed'
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <span className="font-bold uppercase text-[9px]">{ev.platform.slice(0, 2)}</span>
                          <span className="truncate">{ev.title}</span>
                        </div>
                        <span className="shrink-0 text-[9px] font-mono">
                          {ev.scheduled_at ? new Date(ev.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reschedule / Manage Event Modal */}
      {selectedEvent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
          title={`Manage Scheduled Post (${selectedEvent.platform.toUpperCase()})`}
          description={selectedEvent.title}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Caption Preview:
              </div>
              <p className="text-slate-600 dark:text-slate-300 line-clamp-3">
                {selectedEvent.caption}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reschedule Date
                </label>
                <input
                  type="date"
                  value={newScheduleDate}
                  onChange={e => setNewScheduleDate(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reschedule Time
                </label>
                <input
                  type="time"
                  value={newScheduleTime}
                  onChange={e => setNewScheduleTime(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  handleCancelPost(selectedEvent.id);
                  setSelectedEvent(null);
                }}
              >
                Cancel Post
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmReschedule}
                  loading={rescheduling}
                >
                  Save Reschedule
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
