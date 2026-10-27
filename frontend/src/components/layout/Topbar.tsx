import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sun,
  Moon,
  Plus,
  LogOut,
  User,
  ShieldAlert,
  Sparkles,
  Bell,
  Building2,
  ChevronDown,
  Check,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../common/Button';

interface TopbarProps {
  collapsed: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ collapsed }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeWorkspace, setActiveWorkspace] = useState('InfiniteTech AI (Production)');
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const workspaces = [
    'InfiniteTech AI (Production)',
    'Global Agency Staging',
    'Enterprise Marketing Suite',
  ];

  const notifications = [
    { id: 1, title: 'Bulk Generation Ready', time: '5m ago', icon: Sparkles, color: 'text-indigo-500' },
    { id: 2, title: 'LinkedIn Post Scheduled', time: '18m ago', icon: Clock, color: 'text-emerald-500' },
    { id: 3, title: 'Autonomous Publisher Active', time: '1h ago', icon: CheckCircle2, color: 'text-sky-500' },
  ];

  return (
    <header
      className={`sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 transition-all duration-300 ${
        collapsed ? 'ml-20' : 'ml-64'
      }`}
    >
      {/* Left: Workspace Selector & Search Input */}
      <div className="flex items-center gap-3">
        {/* Workspace Selector Mandated by Section 2 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowWorkspaceMenu(!showWorkspaceMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 transition"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate max-w-[170px]">{activeWorkspace}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showWorkspaceMenu && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 z-50">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Select Workspace
              </div>
              {workspaces.map(ws => (
                <button
                  key={ws}
                  type="button"
                  onClick={() => {
                    setActiveWorkspace(ws);
                    setShowWorkspaceMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition ${
                    activeWorkspace === ws
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{ws}</span>
                  {activeWorkspace === ws && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search posts, campaigns..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Quick Mode indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>V1 Engine Active</span>
        </div>

        {/* Create Post Action Button */}
        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/create-post')}
        >
          Create Post
        </Button>

        {/* Notifications Popover Mandated by Section 2 & 37 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowWorkspaceMenu(false);
            }}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 px-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer">Mark all read</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-60 overflow-y-auto">
                {notifications.map(n => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="p-2 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition">
                      <Icon className={`w-4 h-4 ${n.color} mt-0.5 shrink-0`} />
                      <div className="text-left flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User profile dropdown / info */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                {user.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 ml-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button size="sm" variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" variant="primary">Register</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
