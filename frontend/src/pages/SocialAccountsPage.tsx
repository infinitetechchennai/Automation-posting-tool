import React, { useState, useEffect } from 'react';
import {
  Share2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Unlink,
  ExternalLink,
  ShieldCheck,
  Lock,
  Info,
  Trash2,
  Power,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { api, SocialAccount } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

const PLATFORMS = [
  {
    key: 'facebook',
    name: 'Facebook Pages',
    color: 'bg-[#1877F2]',
    buttonText: 'CONNECT FACEBOOK',
    badgeVariant: 'facebook' as const,
    description: 'Publishes posts and media directly to authorized Facebook Pages via Graph API v19.0.',
    requiredScopes: 'pages_show_list, pages_read_engagement, pages_manage_posts',
  },
  {
    key: 'instagram',
    name: 'Instagram Professional',
    color: 'bg-[#E4405F]',
    buttonText: 'CONNECT INSTAGRAM',
    badgeVariant: 'instagram' as const,
    description: 'Publishes single image & video posts to eligible Business/Creator accounts via Content Publishing API.',
    requiredScopes: 'instagram_basic, instagram_content_publish, pages_show_list',
  },
  {
    key: 'linkedin',
    name: 'LinkedIn Profile & Pages',
    color: 'bg-[#0A66C2]',
    buttonText: 'CONNECT LINKEDIN',
    badgeVariant: 'linkedin' as const,
    description: 'Publishes updates to personal profiles or authorized company pages via Community Management API.',
    requiredScopes: 'w_member_social, openid, profile',
  },
  {
    key: 'twitter',
    name: 'X (Twitter)',
    color: 'bg-black dark:bg-slate-800',
    buttonText: 'CONNECT X',
    badgeVariant: 'twitter' as const,
    description: 'Publishes tweets with strict 280-character validation via official Twitter API v2 endpoints.',
    requiredScopes: 'tweet.read, tweet.write, users.read, offline.access',
  },
  {
    key: 'threads',
    name: 'Threads by Meta',
    color: 'bg-slate-900 dark:bg-slate-800',
    buttonText: 'CONNECT THREADS',
    badgeVariant: 'default' as const,
    description: 'Publishes conversational updates and media posts via the official Threads Publishing API.',
    requiredScopes: 'threads_basic, threads_content_publish',
  },
  {
    key: 'youtube',
    name: 'YouTube Shorts & Community',
    color: 'bg-[#FF0000]',
    buttonText: 'CONNECT YOUTUBE',
    badgeVariant: 'default' as const,
    description: 'Publishes community tab announcements and short videos via YouTube Data API v3.',
    requiredScopes: 'https://www.googleapis.com/auth/youtube.upload',
  },
  {
    key: 'pinterest',
    name: 'Pinterest Boards',
    color: 'bg-[#BD081C]',
    buttonText: 'CONNECT PINTEREST',
    badgeVariant: 'default' as const,
    description: 'Publishes visual pins with outbound click links and board categorization via Pinterest API v5.',
    requiredScopes: 'boards:read, pins:read, pins:write',
  },
];

export const SocialAccountsPage: React.FC = () => {
  const toast = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await api.listSocialAccounts();
      setAccounts(data);
    } catch (err: any) {
      toast.error('Failed to load accounts', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleConnect = async (platformKey: string) => {
    setConnectingPlatform(platformKey);
    try {
      const res = await api.getConnectUrl(platformKey);
      if (res.is_mock) {
        // In mock development mode, trigger the mock callback directly
        const callbackRes = await fetch(res.connect_url);
        await callbackRes.json();
        toast.success(
          `${platformKey.toUpperCase()} Connected!`,
          'Demo Mode: Realistic simulated channel active for end-to-end testing.'
        );
        loadAccounts();
      } else {
        // In real mode, redirect to OAuth dialog
        window.location.href = res.connect_url;
      }
    } catch (err: any) {
      toast.error('Connection Error', err.message);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (id: number, name: string) => {
    if (!window.confirm(`Disconnect ${name}?`)) return;
    try {
      await api.disconnectSocialAccount(id);
      toast.info('Account Disconnected', `${name} has been disconnected.`);
      loadAccounts();
    } catch (err: any) {
      toast.error('Disconnect failed', err.message);
    }
  };

  const handleRemove = async (id: number, name: string) => {
    if (!window.confirm(`Permanently remove ${name} from your workspace?`)) return;
    try {
      await api.removeSocialAccount(id);
      toast.success('Account Removed', `${name} removed.`);
      loadAccounts();
    } catch (err: any) {
      toast.error('Remove failed', err.message);
    }
  };

  const handleToggleStatus = async (id: number, name: string) => {
    try {
      await api.toggleSocialAccount(id);
      toast.success('Account Status Updated', `${name} toggle applied.`);
      loadAccounts();
    } catch (err: any) {
      toast.error('Status toggle failed', err.message);
    }
  };

  const handleRefreshToken = async (id: number) => {
    try {
      await api.refreshSocialAccount(id);
      toast.success('Token Refreshed!');
      loadAccounts();
    } catch (err: any) {
      toast.error('Refresh failed', err.message);
    }
  };

  const getConnectedAccount = (platformKey: string) => {
    return accounts.find(
      a =>
        a.platform.toLowerCase() === platformKey ||
        (platformKey === 'twitter' && a.platform.toLowerCase() === 'x')
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Share2 className="w-6 h-6 text-indigo-600" />
            Social Media Account Connections
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Connect Facebook, Instagram, LinkedIn, X, Threads, YouTube, and Pinterest accounts via OAuth 2.0. Sensitive tokens are encrypted at rest.
          </p>
        </div>

        <button
          onClick={loadAccounts}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-2 rounded-lg border border-slate-200 dark:border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Security & Demo Mode Info Banner (Sections 15 & 57) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Enterprise Encryption & OAuth Security: </span>
            SocialPilot AI never asks for your social passwords. Tokens are encrypted at rest with Fernet 256-bit cryptography and credentials never enter client code.
          </div>
        </div>

        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Demo Mode / Simulated Publishing: </span>
            When live social client credentials are not configured in your environment, channels connect in simulated mode and label operations with <code>[DEMO MODE - Simulated]</code>.
          </div>
        </div>
      </div>

      {/* 7 Official Platform Cards (Mandated by Section 14) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PLATFORMS.map(p => {
          const connected = getConnectedAccount(p.key);
          const isConnecting = connectingPlatform === p.key;
          const isConnected = connected && connected.connection_status === 'connected';
          const isDisabled = connected && connected.connection_status === 'disabled';

          return (
            <div
              key={p.key}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${p.color} text-white flex items-center justify-center font-bold text-sm shadow`}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge
                          variant={isConnected ? 'success' : isDisabled ? 'warning' : 'default'}
                          size="sm"
                        >
                          {isConnected ? 'CONNECTED' : isDisabled ? 'DISABLED' : 'DISCONNECTED'}
                        </Badge>
                        {connected && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                            DEMO MODE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[36px]">
                  {p.description}
                </p>

                {/* Account Details if connected */}
                {connected && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Account:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{connected.account_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Username:</span>
                      <span className="text-slate-600 dark:text-slate-300">@{connected.account_name.toLowerCase().replace(/\s+/g, '')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Last Sync:</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {connected.updated_at ? new Date(connected.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 font-sans">
                      Scopes: {connected.permissions?.join(', ') || p.requiredScopes}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons (Section 14: Connect, Disconnect, Remove, Reconnect, Enable/Disable) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {connected ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleToggleStatus(connected.id, connected.account_name)}
                        className={`flex items-center gap-1 font-semibold transition ${
                          isConnected
                            ? 'text-amber-600 hover:text-amber-700'
                            : 'text-emerald-600 hover:text-emerald-700'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isConnected ? 'Disable' : 'Enable'}</span>
                      </button>

                      <button
                        onClick={() => handleRefreshToken(connected.id)}
                        className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Token</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <button
                        onClick={() => handleConnect(p.key)}
                        className="text-slate-600 dark:text-slate-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reconnect</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {isConnected && (
                          <button
                            onClick={() => handleDisconnect(connected.id, connected.account_name)}
                            className="text-amber-500 hover:underline font-semibold flex items-center gap-1"
                          >
                            <Unlink className="w-3 h-3" />
                            <span>Disconnect</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(connected.id, connected.account_name)}
                          className="text-rose-500 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    icon={<Share2 className="w-4 h-4" />}
                    onClick={() => handleConnect(p.key)}
                    loading={isConnecting}
                  >
                    {p.buttonText}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
