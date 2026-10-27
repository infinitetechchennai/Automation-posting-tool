import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PenSquare,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  AlertOctagon,
  Share2,
  BarChart3,
  Bookmark,
  Building2,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  SendHorizontal,
  Zap,
  Eye
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const navSections = [
    {
      title: 'Core Creation',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Create Post', path: '/create-post', icon: PenSquare },
        { name: 'Bulk Auto-Poster', path: '/bulk-schedule', icon: Zap, highlight: true },
        { name: 'AI Content Studio', path: '/ai-studio', icon: Sparkles },
        { name: 'Image Studio', path: '/image-studio', icon: ImageIcon },
        { name: 'Campaigns', path: '/campaigns', icon: Layers },
      ],
    },
    {
      title: 'Publishing & Queue',
      items: [
        { name: 'Content Calendar', path: '/calendar', icon: Calendar },
        { name: 'Auto-Post Queue', path: '/scheduled', icon: Clock },
        { name: 'Live Post Preview', path: '/preview', icon: Eye, highlight: true },
        { name: 'Published Posts', path: '/published', icon: CheckCircle2 },
        { name: 'Drafts', path: '/drafts', icon: FileText },
        { name: 'Failed Posts', path: '/failed', icon: AlertOctagon },
      ],
    },
    {
      title: 'Audience & Settings',
      items: [
        { name: 'Social Accounts', path: '/accounts', icon: Share2 },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Content Templates', path: '/templates', icon: Bookmark },
        { name: 'Brand Settings', path: '/brand-settings', icon: Building2 },
        { name: 'AI Settings', path: '/ai-settings', icon: Cpu },
        { name: 'Application Settings', path: '/app-settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <SendHorizontal className="w-5 h-5 -rotate-12" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent">
                SocialPilot AI
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase">
                Enterprise Studio
              </span>
            </div>
          )}
        </NavLink>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map(section => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <h4 className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                {section.title}
              </h4>
            )}
            {section.items.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : item.highlight
                        ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer system status */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Local Engine</span>
            </div>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
              v1.0.0
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
