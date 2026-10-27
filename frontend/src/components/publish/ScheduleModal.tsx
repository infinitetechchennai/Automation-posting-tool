import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Globe } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledAtIso: string, timezone: string) => Promise<void>;
  loading?: boolean;
}

const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  loading = false,
}) => {
  // Default to tomorrow 10:00 AM in Asia/Kolkata
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState('10:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      const combined = new Date(`${date}T${time}:00`);
      if (isNaN(combined.getTime())) {
        setError('Please select a valid date and time.');
        return;
      }

      if (combined.getTime() <= Date.now()) {
        setError('Scheduled publication time must be in the future.');
        return;
      }

      await onSchedule(combined.toISOString(), timezone);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule post.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Schedule Automatic Publishing (Auto-Poster)"
      description="Select your target publication date, time, and timezone. The autonomous background scheduler will automatically post this to Facebook, Instagram, LinkedIn, and X without any manual intervention."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="text-xs text-indigo-900 dark:text-indigo-200">
            <strong>Autonomous Engine: Active</strong> — Checks queue every 10 seconds. Posts will automatically deploy even if your browser is closed.
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900/60">
            {error}
          </div>
        )}

        {/* Date picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Publication Date
          </label>
          <div className="relative">
            <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Time picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Publication Time
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Timezone picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Timezone (Default: Asia/Kolkata)
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Timestamps are preserved in UTC and rendered in your configured timezone.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<Clock className="w-4 h-4" />}
            onClick={handleConfirm}
            loading={loading}
          >
            Confirm Schedule
          </Button>
        </div>
      </div>
    </Modal>
  );
};
