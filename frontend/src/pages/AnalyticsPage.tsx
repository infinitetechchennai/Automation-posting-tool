import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Share2,
  Users,
  Eye,
  MousePointer,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { api, AnalyticsOverview } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Badge } from '../components/common/Badge';

export const AnalyticsPage: React.FC = () => {
  const toast = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalyticsOverview();
      setAnalytics(data);
    } catch (err: any) {
      toast.error('Failed to load analytics', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Performance & Channel Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor verified cross-platform post outputs, publishing velocity, and audience telemetry.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-2 rounded-lg border border-slate-200 dark:border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Mandatory Notice Distinguishing Real vs Simulated Telemetry Mandated by Section 4 */}
      <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
        analytics?.is_real_data
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
      }`}>
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-xs uppercase tracking-wide">
            {analytics?.is_real_data ? 'REAL DATA MODE' : 'DEVELOPMENT SIMULATION MODE'}
          </div>
          <p className="mt-0.5">
            {analytics?.data_source_notice ||
              'Platform-specific telemetry is clearly distinguished. Real API telemetry is activated when live platform keys are verified.'}
          </p>
        </div>
      </div>

      {/* Overview Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Posts Published
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {analytics?.total_published ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Recorded in database</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Scheduled In Pipeline
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {analytics?.total_scheduled ?? 0}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            Monitored by scheduler
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Failed Publishing Attempts
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {analytics?.total_failed ?? 0}
          </div>
          <div className="text-[11px] text-rose-500 font-medium mt-1">
            Ready for safe retry
          </div>
        </div>
      </div>

      {/* Platform Breakdowns Mandated by Section 4 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Platform-Specific Publishing Statistics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics?.platforms.map(p => (
            <div
              key={p.platform}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Badge variant={p.platform as any} size="sm">
                  {p.platform.toUpperCase()}
                </Badge>
                <span className={`text-[10px] font-bold uppercase ${
                  p.connected ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {p.connected ? 'Active' : 'Unconnected'}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Published Posts:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {p.posts_published_count}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Audience / Followers:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {p.followers_count ? p.followers_count.toLocaleString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Estimated Reach:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {p.estimated_reach ? p.estimated_reach.toLocaleString() : '—'}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700 font-mono">
                {p.disclaimer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
