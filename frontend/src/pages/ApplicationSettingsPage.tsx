import React from 'react';
import {
  Settings,
  ShieldAlert,
  Key,
  Globe,
  Database,
  Terminal,
  ExternalLink,
  Layers,
  Lock
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const ApplicationSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Application & Platform API Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Dual-mode architecture documentation, environment variable specifications, and external developer console requirements.
        </p>
      </div>

      {/* Mode A vs Mode B Architecture Breakdown Mandated by Section 21 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-900/60 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              MODE A: Local Development (₹0 Budget)
            </h2>
            <Badge variant="warning" size="sm">ACTIVE DEFAULT</Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Uses local Ollama LLM, local SQLite/PostgreSQL, local filesystem media storage, and simulated social adapters.
            Allows full testing of multi-platform post generation, editing, previews, scheduling, and error diagnostic retries without requiring external subscriptions or paid API credits.
          </p>
          <div className="text-[11px] font-mono bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            APP_MODE=mock
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              MODE B: Real Production Publishing
            </h2>
            <Badge variant="success" size="sm">ENTERPRISE READY</Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Connects to official Facebook Graph API, Instagram Publishing API, LinkedIn Community API, and X API v2.
            Activated when you configure official Client IDs and Secrets in your <code className="font-mono text-indigo-600 dark:text-indigo-400">.env</code> file.
          </p>
          <div className="text-[11px] font-mono bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            APP_MODE=real
          </div>
        </div>
      </div>

      {/* Official Developer Console Guidelines Mandated by Section 11 & 26 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          Official Platform Developer Requirements & Approval Guidelines
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          When transitioning from Mock Mode to Live Publishing, consult the official developer requirements:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>Meta / Facebook Graph API</span>
              <Badge variant="facebook" size="sm">Graph v19.0</Badge>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              Requires a registered Meta for Developers account, Business Verification, and permissions review for <code className="font-mono">pages_manage_posts</code> before publishing to public pages. Free for standard rate limits.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="font-bold text-pink-600 dark:text-pink-400 flex items-center justify-between">
              <span>Instagram Publishing API</span>
              <Badge variant="instagram" size="sm">Business / Creator</Badge>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              Target account must be converted to an Instagram Professional (Business or Creator) account and linked to a verified Facebook Page. Content container creation requires an attached image or video asset.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="font-bold text-[#0A66C2] flex items-center justify-between">
              <span>LinkedIn Developer Platform</span>
              <Badge variant="linkedin" size="sm">UGC & REST</Badge>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              Requires <code className="font-mono">Share on LinkedIn</code> product approval. For company pages, requires Organizational Administrator verification. Free for authorized member profiles.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>X (Twitter) Developer Portal</span>
              <Badge variant="twitter" size="sm">API v2</Badge>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              Requires Project creation with OAuth 2.0 PKCE User Context. X Free tier supports write-only posting up to 1,500 tweets/month. Strict 280-character maximum limits are enforced.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
