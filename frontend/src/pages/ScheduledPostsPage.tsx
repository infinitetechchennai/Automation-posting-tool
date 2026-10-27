import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Send,
  XCircle,
  RefreshCw,
  Edit3,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Eye,
  X
} from 'lucide-react';
import { api, Post, MediaItem, PlatformPost } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

const INFINITETECH_FLYER_TEMPLATES: Record<string, string> = {
  facebook: `🚀 FROM CHAOS TO CONTROL. WORK LESS. ACHIEVE MORE.

Are you spending half your workday buried under admin tasks?

🔴 BEFORE InfiniteTech AI:
❌ Manual Invoicing & Chasing Payments
❌ Endless Data Entry & Spreadsheets
❌ Scheduling Conflicts & Missed Calls
❌ Forgotten Follow-ups & Lost Deals
❌ Zero Time to Grow Your Business

🟢 AFTER InfiniteTech AI:
✅ Auto Invoicing on Autopilot
✅ Smart Intelligent Scheduling
✅ Automated Data Extraction & Entry
✅ Instant AI Follow-ups 24/7
✅ More Time. More Life.

💡 AUTOMATE & ELEVATE YOUR BUSINESS:
📄 Smart Invoicing: Create, send & track invoices automatically.
🗓️ Intelligent Scheduling: No more clashes, perfectly planned.
🗄️ Data Entry on Autopilot: Extract, enter, organize, done.
💬 Instant Follow-ups: AI that follows up so you don't have to.
📈 Insights That Drive Growth: Real-time reports for smarter decisions.

⚡ SAVE UP TO 70% OF YOUR ADMIN TIME.
Let InfiniteTech AI take care of the rest!

🌐 Website: www.infinitetechai.com
📞 Reach US: +91-9884777171
✉️ Email: sales@infinitetechai.com

#InfiniteTechAI #Automation #Productivity #WorkLessAchieveMore #AIforBusiness`,

  instagram: `From CHAOS to CONTROL ✨ Work Less. Achieve More.

Still trapped doing admin work manually?

❌ BEFORE:
• Manual Invoicing
• Endless Data Entry
• Scheduling Conflicts
• Missed Follow-ups
• No Time to Grow

✅ AFTER:
• Auto Invoicing
• Smart Scheduling
• Automated Data Entry
• Instant Follow-ups
• More Time. More Life.

🎯 Save up to 70% of your admin time with InfiniteTech AI.
Let InfiniteTech AI take care of the rest!

📞 +91-9884777171 | sales@infinitetechai.com
👉 Link in bio: www.infinitetechai.com

#InfiniteTechAI #BusinessAutomation #SmartInvoicing #ProductivityHacks #SaveTime`,

  linkedin: `FROM CHAOS TO CONTROL: Why modern leaders are automating administrative overhead.

Every hour business leaders spend on manual invoicing, scheduling clashes, and data entry is an hour not spent driving revenue.

At InfiniteTech AI, our mission is clear: Automate the repetitive so you focus on what matters.

5 Core Pillars to Elevate Your Business:
1. Smart Invoicing: Create, send, and track invoices automatically.
2. Intelligent Scheduling: Zero calendar conflicts, perfectly synced meetings.
3. Data Entry on Autopilot: Extract, organize, and structure business records instantly.
4. Instant Follow-ups: AI that engages leads and clients without manual delays.
5. Actionable Insights: Real-time executive dashboards for smarter decisions.

The Result: Save up to 70% of your admin time and eliminate operational friction.

Connect with us:
🌐 www.infinitetechai.com
📞 +91-9884777171 | ✉️ sales@infinitetechai.com

#InfiniteTechAI #OperationalExcellence #BusinessAutomation #Productivity`,

  twitter: `FROM CHAOS TO CONTROL 🚀

Stop wasting hours on manual invoicing, data entry & missed follow-ups.

⚡ InfiniteTech AI automates the repetitive
⚡ Save up to 70% admin time

👉 www.infinitetechai.com | +91-9884777171 #AI #Automation`
};

export const ScheduledPostsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMediaId, setEditMediaId] = useState<number | null>(null);
  const [editCaptions, setEditCaptions] = useState<Record<string, string>>({});
  const [activePlatformTab, setActivePlatformTab] = useState<string>('facebook');
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsData, mediaData] = await Promise.all([
        api.listPosts('scheduled'),
        api.listMedia()
      ]);
      setPosts(postsData);
      setMediaList(mediaData);
    } catch (err: any) {
      toast.error('Failed to load queue', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getMediaById = (id: any): MediaItem | undefined => {
    return mediaList.find(m => m.id === Number(id) || String(m.id) === String(id));
  };

  const handlePublishImmediately = async (postId: number) => {
    try {
      await api.publishNow(postId);
      toast.success('Post Published Immediately!');
      loadData();
    } catch (err: any) {
      toast.error('Publishing failed', err.message);
    }
  };

  const handleCancel = async (ppId: number) => {
    if (!window.confirm('Cancel this scheduled post?')) return;
    try {
      await api.cancelPlatformPost(ppId);
      toast.info('Post cancelled');
      loadData();
    } catch (err: any) {
      toast.error('Cancel failed', err.message);
    }
  };

  // Open Edit Modal
  const openEditModal = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    
    // Determine existing media ID from first platform post having media
    let currentMediaId: number | null = null;
    for (const pp of post.platform_posts) {
      if (pp.media_ids && pp.media_ids.length > 0) {
        currentMediaId = Number(pp.media_ids[0]);
        break;
      }
    }
    setEditMediaId(currentMediaId);

    // Populate platform captions
    const caps: Record<string, string> = {};
    for (const pp of post.platform_posts) {
      caps[pp.platform.toLowerCase()] = pp.caption;
    }
    setEditCaptions(caps);
    setActivePlatformTab(post.platform_posts[0]?.platform.toLowerCase() || 'facebook');
  };

  const closeEditModal = () => {
    setEditingPost(null);
  };

  // 1-Click apply rich flyer content
  const applyFlyerTemplateToCurrent = () => {
    setEditTitle("FROM CHAOS TO CONTROL: Work Less, Achieve More | InfiniteTech AI");
    setEditCaptions({
      facebook: INFINITETECH_FLYER_TEMPLATES.facebook,
      instagram: INFINITETECH_FLYER_TEMPLATES.instagram,
      linkedin: INFINITETECH_FLYER_TEMPLATES.linkedin,
      twitter: INFINITETECH_FLYER_TEMPLATES.twitter,
    });
    // Find flyer media id if available
    const flyer = mediaList.find(m => m.storage_key.includes('infinitetech') || m.original_filename.includes('InfiniteTech'));
    if (flyer) {
      setEditMediaId(flyer.id);
    }
    toast.success('Flyer Content Applied!', 'Headline, Before/After & 5 Feature Pillars loaded.');
  };

  // Handle uploading a brand new image directly in the modal
  const handleUploadNewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploaded = await api.uploadMedia(file, file.name);
      setMediaList(prev => [uploaded, ...prev]);
      setEditMediaId(uploaded.id);
      toast.success('Image Uploaded!', `Selected ${uploaded.original_filename} as new post flyer.`);
    } catch (err: any) {
      toast.error('Upload Failed', err.message || 'Could not upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save changes to post, image, and platform posts
  const handleSavePostChanges = async () => {
    if (!editingPost) return;
    setSavingEdit(true);

    try {
      const platformPostsUpdates = editingPost.platform_posts.map(pp => ({
        id: pp.id,
        platform: pp.platform,
        caption: editCaptions[pp.platform.toLowerCase()] || pp.caption,
        media_ids: editMediaId ? [editMediaId] : []
      }));

      await api.updatePost(editingPost.id, {
        title: editTitle,
        media_ids: editMediaId ? [editMediaId] : [],
        platform_posts: platformPostsUpdates
      });

      toast.success('Post & Image Updated!', 'All platform captions and attached image have been saved.');
      closeEditModal();
      loadData();
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Could not update post');
    } finally {
      setSavingEdit(false);
    }
  };

  const selectedEditMedia = editMediaId ? getMediaById(editMediaId) : undefined;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" />
            Scheduled Posts Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Posts persisted in the database and monitored by Celery / background worker. Jobs survive system restarts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/bulk-schedule')}
            icon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
          >
            Bulk Auto-Poster
          </Button>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-2 rounded-lg border border-slate-200 dark:border-slate-800 transition bg-white dark:bg-slate-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No scheduled posts in the queue. Create and schedule a post from the Post Studio or Bulk Auto-Poster!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            // Find attached media for this post
            let postMedia: MediaItem | undefined;
            for (const pp of post.platform_posts) {
              if (pp.media_ids && pp.media_ids.length > 0) {
                postMedia = getMediaById(pp.media_ids[0]);
                if (postMedia) break;
              }
            }

            return (
              <div
                key={post.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-start gap-4">
                    {/* Media Thumbnail */}
                    {postMedia ? (
                      <div
                        onClick={() => navigate(`/preview/${post.id}`)}
                        className="relative group shrink-0 cursor-pointer"
                        title="Click to view realistic multi-platform preview"
                      >
                        <img
                          src={postMedia.url}
                          alt={postMedia.original_filename}
                          className="w-16 h-20 object-cover rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm group-hover:ring-2 group-hover:ring-indigo-500 transition"
                        />
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[9px] font-bold bg-slate-900/80 text-white backdrop-blur">
                          Flyer
                        </span>
                        <div className="absolute inset-0 bg-indigo-900/40 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => navigate(`/preview/${post.id}`)}
                        className="w-16 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 shrink-0 cursor-pointer hover:border-indigo-400 transition"
                        title="Click to preview post"
                      >
                        <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                        <span className="text-[10px]">No image</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <h3
                        onClick={() => navigate(`/preview/${post.id}`)}
                        className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition flex items-center gap-1.5"
                        title="Click to preview post"
                      >
                        <span>{post.title}</span>
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="warning" size="sm">SCHEDULED</Badge>
                        <span className="text-xs text-slate-400">
                          Created: {new Date(post.created_at).toLocaleString()}
                        </span>
                        {postMedia && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            📎 {postMedia.original_filename}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => navigate(`/preview/${post.id}`)}
                    >
                      Preview Post
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => openEditModal(post)}
                    >
                      Edit Post & Image
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Send className="w-3.5 h-3.5" />}
                      onClick={() => handlePublishImmediately(post.id)}
                    >
                      Publish Immediately
                    </Button>
                  </div>
                </div>

                {/* Platform breakdown items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {post.platform_posts.map(pp => (
                    <div
                      key={pp.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={pp.platform as any} size="sm">
                              {pp.platform.toUpperCase()}
                            </Badge>
                            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                              {pp.scheduled_at ? new Date(pp.scheduled_at).toLocaleString() : 'Pending'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCancel(pp.id)}
                            className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-4 leading-relaxed whitespace-pre-line font-sans">
                          {pp.caption}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{pp.caption.length} characters</span>
                        {pp.media_ids && pp.media_ids.length > 0 && (
                          <span className="text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Image Attached
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT POST & CHANGE IMAGE MODAL */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-500" />
                  Edit Post & Change Image
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update heading, change attached flyer/image, or customize platform captions.
                </p>
              </div>

              <button
                onClick={closeEditModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Flyer Template Quick Button */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Want to use the exact InfiniteTech AI marketing flyer copy?</span>
                </div>
                <button
                  type="button"
                  onClick={applyFlyerTemplateToCurrent}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                >
                  ⚡ Apply Flyer Content
                </button>
              </div>

              {/* 1. Post Heading / Title */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Post Heading / Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* 2. Change / Upload Image Section */}
              <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    Attached Flyer / Image
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Change image or upload a new one
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Image Preview */}
                  <div className="sm:col-span-4 flex items-center gap-3">
                    {selectedEditMedia ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedEditMedia.url}
                          alt="Flyer Preview"
                          className="w-16 h-20 object-cover rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {selectedEditMedia.original_filename}
                          </p>
                          <p className="text-slate-400 text-[10px]">
                            {selectedEditMedia.width} × {selectedEditMedia.height} px
                          </p>
                          <span className="inline-block mt-1 text-[10px] text-emerald-500 font-semibold">
                            ✓ Active Attached Image
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-20 rounded-lg bg-slate-200 dark:bg-slate-700 flex flex-col items-center justify-center text-slate-400 text-center text-[10px] p-1">
                        No image attached
                      </div>
                    )}
                  </div>

                  {/* Image Controls */}
                  <div className="sm:col-span-8 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={editMediaId || ''}
                        onChange={e => setEditMediaId(e.target.value ? Number(e.target.value) : null)}
                        className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">No media (Text only)</option>
                        {mediaList.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.original_filename} ({m.width ? `${m.width}x${m.height}` : m.mime_type})
                          </option>
                        ))}
                      </select>

                      {/* Direct Upload New Image Button */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleUploadNewImage}
                      />
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shrink-0 disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingImage ? 'Uploading...' : 'Upload New'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Upload any marketing image (.png, .jpg, .webp) or pick an existing image from your media library.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Platform Specific Captions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <label className="font-semibold text-slate-900 dark:text-slate-100">
                    Platform Captions & Post Details
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Tailored for each social network
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2">
                  {editingPost.platform_posts.map(pp => {
                    const plat = pp.platform.toLowerCase();
                    const active = activePlatformTab === plat;
                    return (
                      <button
                        key={pp.id}
                        type="button"
                        onClick={() => setActivePlatformTab(plat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                          active
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {plat}
                      </button>
                    );
                  })}
                </div>

                {/* Active Caption Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize font-semibold text-indigo-500">
                      {activePlatformTab} Caption:
                    </span>
                    <span className={activePlatformTab === 'twitter' && (editCaptions[activePlatformTab]?.length || 0) > 280 ? 'text-rose-500 font-bold' : ''}>
                      {editCaptions[activePlatformTab]?.length || 0}
                      {activePlatformTab === 'twitter' ? ' / 280 characters' : ' characters'}
                    </span>
                  </div>

                  <textarea
                    rows={8}
                    value={editCaptions[activePlatformTab] || ''}
                    onChange={e => setEditCaptions({
                      ...editCaptions,
                      [activePlatformTab]: e.target.value
                    })}
                    placeholder={`Enter caption for ${activePlatformTab}...`}
                    className="w-full p-3 text-xs leading-relaxed bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/20">
              <Button
                variant="outline"
                size="sm"
                onClick={closeEditModal}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={savingEdit}
                onClick={handleSavePostChanges}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {savingEdit ? 'Saving Changes...' : 'Save Post & Image'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
