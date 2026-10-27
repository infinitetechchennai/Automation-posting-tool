import React, { useState } from 'react';
import { AlertTriangle, Sparkles, X, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DevModeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between transition-all">
      <div className="flex items-center gap-2 max-w-4xl">
        <div className="flex items-center gap-1 font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] shrink-0">
          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          DEVELOPMENT MODE — SIMULATED PUBLISHING
        </div>
        <span className="hidden sm:inline text-slate-700 dark:text-slate-300">
          Posts are safely simulated locally with ₹0 cost. No live social accounts will be modified. Real publishing can be activated in{' '}
          <Link to="/app-settings" className="font-semibold underline hover:text-amber-700 dark:hover:text-amber-200">
            Application Settings
          </Link>.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/app-settings"
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-amber-500/20 text-[11px] font-medium"
        >
          <SettingsIcon className="w-3 h-3" />
          <span>Config</span>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-amber-500/20 rounded"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
