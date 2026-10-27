import React, { useState, useEffect } from 'react';
import { AlertOctagon, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { api, Post } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const FailedPostsPage: React.FC = () => {
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const loadFailed = async () => {
    setLoading(true);
    try {
      const data = await api.listPosts('failed');
      setPosts(data);
    } catch (err: any) {
      toast.error('Failed to load failed posts', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFailed();
  }, []);

  const handleRetryPlatformPost = async (ppId: number) => {
    setRetryingId(ppId);
    try {
      const res = await api.retryPlatformPost(ppId);
      if (res.success) {
        toast.success('Retry Succeeded!', `Platform post status: ${res.status}`);
      } else {
        toast.error('Retry Failed', res.error_message || 'Publication was rejected by platform');
      }
      loadFailed();
    } catch (err: any) {
      toast.error('Error during retry', err.message);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-rose-500" />
            Failed Posts & Error Diagnostic Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Diagnose API rejections, rate limits, or permission errors. Safe retry verifies publication hasn't already occurred.
          </p>
        </div>

        <button
          onClick={loadFailed}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-2 rounded-lg border border-slate-200 dark:border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          Zero publishing failures! All channels are operating cleanly.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            const failedPlatformPosts = post.platform_posts.filter(p => p.status === 'failed');
            return (
              <div
                key={post.id}
                className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="danger" size="sm">FAILED</Badge>
                      <span className="text-xs text-slate-400">
                        {failedPlatformPosts.length} failed channel(s)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Failed platform breakdown */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {failedPlatformPosts.map(pp => (
                    <div
                      key={pp.id}
                      className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={pp.platform as any} size="sm">
                            {pp.platform.toUpperCase()}
                          </Badge>
                          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                            Attempts: {pp.attempt_count}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="danger"
                          icon={<RefreshCw className={`w-3.5 h-3.5 ${retryingId === pp.id ? 'animate-spin' : ''}`} />}
                          onClick={() => handleRetryPlatformPost(pp.id)}
                          loading={retryingId === pp.id}
                        >
                          Safe Retry
                        </Button>
                      </div>

                      {/* Diagnostic Error Message */}
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 font-mono">
                        <div className="font-bold text-[10px] uppercase text-rose-500 mb-0.5">
                          API Error Diagnostic:
                        </div>
                        {pp.error_message || 'Unknown network rejection'}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {pp.caption}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
