import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Edit, Trash2, Send, Clock, RefreshCw } from 'lucide-react';
import { api, Post } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const DraftsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const data = await api.listPosts('draft');
      setPosts(data);
    } catch (err: any) {
      toast.error('Failed to load drafts', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this draft permanently?')) return;
    try {
      await api.deletePost(id);
      toast.info('Draft deleted');
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  const handlePublishNow = async (id: number) => {
    try {
      await api.publishNow(id);
      toast.success('Draft published successfully!');
      loadDrafts();
    } catch (err: any) {
      toast.error('Publish failed', err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Drafts & Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Saved content drafts ready for editorial review, scheduling, or publishing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/create-post')}
          >
            New Post
          </Button>
          <button
            onClick={loadDrafts}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No saved drafts in your workspace. Click New Post to start writing!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map(post => (
            <div
              key={post.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 hover:shadow transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                    {post.title}
                  </h3>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Delete draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {post.platform_posts.map(pp => (
                    <Badge key={pp.id} variant={pp.platform as any} size="sm">
                      {pp.platform.toUpperCase()}
                    </Badge>
                  ))}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {post.platform_posts[0]?.caption || post.topic}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Saved: {new Date(post.updated_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Send className="w-3.5 h-3.5" />}
                    onClick={() => handlePublishNow(post.id)}
                  >
                    Publish
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
