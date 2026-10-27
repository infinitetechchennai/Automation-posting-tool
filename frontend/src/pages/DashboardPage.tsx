import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Share2,
  Sparkles,
  PenSquare,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api, DashboardStats } from '../services/api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, act] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentActivity(8),
      ]);
      setStats(s);
      setRecentActivity(act);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statCards = [
    {
      title: 'Total Posts',
      value: stats?.total_posts ?? 0,
      icon: FileText,
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      link: '/drafts',
    },
    {
      title: 'Published Posts',
      value: stats?.published_posts ?? 0,
      icon: CheckCircle2,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      link: '/published',
    },
    {
      title: 'Scheduled Posts',
      value: stats?.scheduled_posts ?? 0,
      icon: Clock,
      color: 'from-amber-600 to-orange-600',
      bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      link: '/scheduled',
    },
    {
      title: 'Drafts',
      value: stats?.draft_posts ?? 0,
      icon: FileText,
      color: 'from-indigo-600 to-purple-600',
      bgColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      link: '/drafts',
    },
    {
      title: 'Failed Posts',
      value: stats?.failed_posts ?? 0,
      icon: AlertOctagon,
      color: 'from-rose-600 to-red-600',
      bgColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      link: '/failed',
    },
    {
      title: 'Connected Accounts',
      value: stats?.connected_accounts ?? 0,
      icon: Share2,
      color: 'from-cyan-600 to-blue-600',
      bgColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      link: '/accounts',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner and Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-sm border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            SocialPilot AI Automation
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Social Media Command Center
          </h1>
          <p className="text-slate-300 text-xs md:text-sm max-w-xl">
            Generate complete multi-platform content packages with local AI, schedule across channels, and automate publishing.
          </p>
        </div>

        {/* Quick Action Buttons mandated by Section 4 */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <Button
            size="sm"
            variant="primary"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => navigate('/create-post')}
          >
            Generate AI Post
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Clock className="w-4 h-4 text-indigo-400" />}
            onClick={() => navigate('/scheduled')}
          >
            ⚡ Auto-Post Queue
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<PenSquare className="w-4 h-4" />}
            onClick={() => navigate('/create-post')}
          >
            Create Post
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Calendar className="w-4 h-4" />}
            onClick={() => navigate('/calendar')}
          >
            Calendar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Share2 className="w-4 h-4" />}
            onClick={() => navigate('/accounts')}
          >
            Connect Account
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Layers className="w-4 h-4" />}
            onClick={() => navigate('/campaigns')}
          >
            Create Campaign
          </Button>
        </div>
      </div>

      {/* 6 Key Stat Cards mandated by Section 4 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(c => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              onClick={() => navigate(c.link)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bgColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {loading ? '—' : c.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {c.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-Posting Engine Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Autonomous Auto-Posting Scheduler</h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                POLLING EVERY 10s
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Posts scheduled for auto-publishing will automatically be dispatched to Facebook, Instagram, LinkedIn, and X without manual confirmation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="text-white border-slate-700 hover:bg-slate-800"
            icon={<Clock className="w-4 h-4 text-indigo-400" />}
            onClick={() => navigate('/scheduled')}
          >
            View Auto-Post Queue ({stats?.scheduled_posts ?? 0})
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => navigate('/create-post')}
          >
            ⚡ Create & Auto-Post
          </Button>
        </div>
      </div>

      {/* Recent Activity Table mandated by Section 4 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recent Activity & Publishing Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time audit log of multi-platform post executions and background jobs.
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No activity records found yet. Click <strong>Generate AI Post</strong> to create your first content package!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Post Title</th>
                  <th className="pb-3 font-semibold">Platform</th>
                  <th className="pb-3 font-semibold">Account</th>
                  <th className="pb-3 font-semibold">Scheduled Time</th>
                  <th className="pb-3 font-semibold">Publication Time</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentActivity.map(act => (
                  <tr key={act.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {act.title}
                    </td>
                    <td className="py-3">
                      <Badge variant={act.platform as any} size="sm">
                        {act.platform.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {act.account_name}
                    </td>
                    <td className="py-3 text-slate-500 font-mono text-[11px]">
                      {act.scheduled_at ? new Date(act.scheduled_at).toLocaleString() : 'Immediate'}
                    </td>
                    <td className="py-3 text-slate-500 font-mono text-[11px]">
                      {act.published_at ? new Date(act.published_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          act.status === 'published'
                            ? 'success'
                            : act.status === 'scheduled' || act.status === 'pending'
                            ? 'warning'
                            : act.status === 'failed'
                            ? 'danger'
                            : 'default'
                        }
                        size="sm"
                      >
                        {act.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/drafts`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
