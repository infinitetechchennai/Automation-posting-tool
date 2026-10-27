import React, { useState, useEffect } from 'react';
import { CheckCircle2, RefreshCw, Copy, ExternalLink, Calendar, Hash } from 'lucide-react';
import { api, Post } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const PublishedPostsPage: React.FC = () => {
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPublished = async () => {
    setLoading(true);
    try {
      const data = await api.listPosts('published');
      setPosts(data);
    } catch (err: any) {
      toast.error('Failed to load published posts', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublished();
  }, []);

  const copyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    toast.info('Copied!', 'Caption copied to clipboard.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            Published Posts History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical audit log of posts successfully published to connected social networks.
          </p>
        </div>

        <button
          onClick={loadPublished}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-2 rounded-lg border border-slate-200 dark:border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No published posts yet. Click Publish Now on any post in Create Post!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div
              key={post.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="success" size="sm">PUBLISHED</Badge>
                    <span className="text-xs text-slate-400">
                      Topic: {post.topic}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono text-slate-400">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Platform breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {post.platform_posts.map(pp => (
                  <div
                    key={pp.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={pp.platform as any} size="sm">
                          {pp.platform.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] font-mono text-slate-500">
                          ID: {pp.platform_post_id || 'N/A'}
                        </span>
                      </div>
                      <button
                        onClick={() => copyCaption(pp.caption)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Copy caption"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {pp.caption}
                    </p>

                    <div className="text-[10px] text-slate-400 pt-1 font-mono">
                      Published: {pp.published_at ? new Date(pp.published_at).toLocaleString() : 'Done'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
