import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Eye,
  Smartphone,
  Monitor,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Share2,
  Calendar,
  Clock,
  Edit3,
  Send,
  Copy,
  ZoomIn,
  RefreshCw,
  Layers,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Grid,
  Maximize2,
  X
} from 'lucide-react';
import { api, Post, MediaItem } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

import { FacebookPreview } from '../components/previews/FacebookPreview';
import { InstagramPreview } from '../components/previews/InstagramPreview';
import { LinkedInPreview } from '../components/previews/LinkedInPreview';
import { TwitterPreview } from '../components/previews/TwitterPreview';
import { ImageEditorModal } from '../components/image-editor/ImageEditorModal';

type PlatformType = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'threads' | 'youtube' | 'pinterest' | 'all';
type ViewportType = 'desktop' | 'mobile';

export const PostPreviewPage: React.FC = () => {
  const { postId } = useParams<{ postId?: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(postId ? Number(postId) : null);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<PlatformType>('facebook');
  const [viewport, setViewport] = useState<ViewportType>('desktop');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);

  // Image Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Image Studio Modal
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [regeneratingImg, setRegeneratingImg] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  // In-line Quick Edit Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCaptions, setEditCaptions] = useState<Record<string, string>>({});
  const [editMediaId, setEditMediaId] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllPostsAndMedia();
  }, []);

  useEffect(() => {
    if (postId) {
      setSelectedPostId(Number(postId));
    }
  }, [postId]);

  const loadAllPostsAndMedia = async () => {
    setLoading(true);
    try {
      const [allPosts, media] = await Promise.all([
        api.listPosts(),
        api.listMedia()
      ]);
      setPosts(allPosts);
      setMediaList(media);

      if (allPosts.length > 0) {
        if (postId) {
          const matched = allPosts.find(p => p.id === Number(postId));
          if (matched) setSelectedPostId(matched.id);
          else setSelectedPostId(allPosts[0].id);
        } else if (!selectedPostId) {
          setSelectedPostId(allPosts[0].id);
        }
      }
    } catch (err: any) {
      toast.error('Failed to load posts', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click quick select image
  const handleQuickSelectImage = async (mediaItem: MediaItem) => {
    if (!currentPost) return;
    try {
      const platformPostsUpdates = currentPost.platform_posts.map(pp => ({
        id: pp.id,
        platform: pp.platform,
        caption: pp.caption,
        media_ids: [mediaItem.id]
      }));

      await api.updatePost(currentPost.id, {
        media_ids: [mediaItem.id],
        platform_posts: platformPostsUpdates
      });

      toast.success('Visual Image Applied!', `Now using ${mediaItem.alt_text || mediaItem.original_filename}`);
      await loadAllPostsAndMedia();
    } catch (err: any) {
      toast.error('Failed to change image', err.message);
    }
  };

  const currentPost = posts.find(p => p.id === selectedPostId);
  const currentIndex = posts.findIndex(p => p.id === selectedPostId);

  // Helper to find media by ID
  const getMediaById = (id: any): MediaItem | undefined => {
    if (!id) return undefined;
    return mediaList.find(m => m.id === Number(id) || String(m.id) === String(id));
  };

  // Find the primary media object for the post
  const primaryMediaId = currentPost?.platform_posts.find(pp => pp.media_ids && pp.media_ids.length > 0)?.media_ids?.[0];
  const postMedia = getMediaById(primaryMediaId);

  const getPlatformPost = (platformName: string) => {
    return currentPost?.platform_posts.find(pp => pp.platform.toLowerCase() === platformName.toLowerCase());
  };

  // Navigation between posts
  const handlePrevPost = () => {
    if (currentIndex > 0) {
      const prevPost = posts[currentIndex - 1];
      setSelectedPostId(prevPost.id);
      navigate(`/preview/${prevPost.id}`, { replace: true });
    }
  };

  const handleNextPost = () => {
    if (currentIndex < posts.length - 1) {
      const nextPost = posts[currentIndex + 1];
      setSelectedPostId(nextPost.id);
      navigate(`/preview/${nextPost.id}`, { replace: true });
    }
  };

  // Copy active caption
  const handleCopyCaption = () => {
    if (!currentPost) return;
    const pPost = getPlatformPost(activePlatform === 'all' ? 'facebook' : activePlatform);
    if (pPost?.caption) {
      navigator.clipboard.writeText(pPost.caption);
      toast.success('Caption Copied!', `Copied ${activePlatform.toUpperCase()} caption to clipboard.`);
    } else {
      toast.warning('No caption available for this network.');
    }
  };

  // Publish Immediately
  const handlePublishNow = async () => {
    if (!currentPost) return;
    try {
      await api.publishNow(currentPost.id);
      toast.success('Post Published!', 'Dispatched to connected channels.');
      loadAllPostsAndMedia();
    } catch (err: any) {
      toast.error('Publishing failed', err.message);
    }
  };

  // Approve Post for Auto-Posting
  const handleApprove = async () => {
    if (!currentPost) return;
    setApproving(true);
    try {
      await api.approvePost(currentPost.id);
      toast.success('Post Approved!', 'Marked as approved and scheduled for automated publishing.');
      await loadAllPostsAndMedia();
    } catch (err: any) {
      toast.error('Approval failed', err.message);
    } finally {
      setApproving(false);
    }
  };

  // Duplicate Post
  const handleDuplicate = async () => {
    if (!currentPost) return;
    setDuplicating(true);
    try {
      const dup = await api.duplicatePost(currentPost.id);
      toast.success('Post Duplicated!', `Created copy #${dup.id}.`);
      await loadAllPostsAndMedia();
      setSelectedPostId(dup.id);
      navigate(`/preview/${dup.id}`, { replace: true });
    } catch (err: any) {
      toast.error('Duplication failed', err.message);
    } finally {
      setDuplicating(false);
    }
  };

  // Quick AI Re-generate Graphic
  const handleRegenerateGraphic = async () => {
    if (!currentPost) return;
    setRegeneratingImg(true);
    try {
      await api.generatePostImage(currentPost.id);
      toast.success('AI Graphic Regenerated!', 'Generated and applied new layout composition.');
      await loadAllPostsAndMedia();
    } catch (err: any) {
      toast.error('Regeneration failed', err.message);
    } finally {
      setRegeneratingImg(false);
    }
  };

  // Open Edit Modal
  const openEditModal = () => {
    if (!currentPost) return;
    setEditTitle(currentPost.title);
    setEditMediaId(primaryMediaId ? Number(primaryMediaId) : null);
    const caps: Record<string, string> = {};
    for (const pp of currentPost.platform_posts) {
      caps[pp.platform.toLowerCase()] = pp.caption;
    }
    setEditCaptions(caps);
    setIsEditing(true);
  };

  // Handle uploading a brand new image
  const handleUploadNewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploaded = await api.uploadMedia(file, file.name);
      setMediaList(prev => [uploaded, ...prev]);
      setEditMediaId(uploaded.id);
      toast.success('Image Uploaded!', `Selected ${uploaded.original_filename} as post graphic.`);
    } catch (err: any) {
      toast.error('Upload Failed', err.message || 'Could not upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save changes
  const handleSaveEdit = async () => {
    if (!currentPost) return;
    setSavingEdit(true);
    try {
      const platformPostsUpdates = currentPost.platform_posts.map(pp => ({
        id: pp.id,
        platform: pp.platform,
        caption: editCaptions[pp.platform.toLowerCase()] || pp.caption,
        media_ids: editMediaId ? [editMediaId] : []
      }));

      await api.updatePost(currentPost.id, {
        title: editTitle,
        media_ids: editMediaId ? [editMediaId] : [],
        platform_posts: platformPostsUpdates
      });

      toast.success('Post Updated!', 'Title, image, and captions saved.');
      setIsEditing(false);
      await loadAllPostsAndMedia();
    } catch (err: any) {
      toast.error('Save failed', err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-500">Loading realistic post previews...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
          <Eye className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          No Posts to Preview Yet
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Create a post or use the Bulk Auto-Poster to generate posts with custom copy and AI graphics.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" onClick={() => navigate('/bulk-schedule')}>
            ⚡ Open Bulk Auto-Poster
          </Button>
          <Button variant="outline" onClick={() => navigate('/create-post')}>
            Create Single Post
          </Button>
        </div>
      </div>
    );
  }

  const fbPost = getPlatformPost('facebook');
  const igPost = getPlatformPost('instagram');
  const liPost = getPlatformPost('linkedin');
  const twPost = getPlatformPost('twitter');
  const thPost = getPlatformPost('threads') || igPost || fbPost;
  const ytPost = getPlatformPost('youtube') || liPost || fbPost;
  const pinPost = getPlatformPost('pinterest') || igPost || fbPost;

  // Render helpers for additional platforms
  const renderThreadsPreview = () => (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
            IT
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white">infinitetech.ai</span>
              <span className="text-[10px] text-slate-400">• 2h</span>
            </div>
            <span className="text-[10px] text-slate-400">Enterprise AI</span>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-400 font-mono">@threads</span>
      </div>
      <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
        {thPost?.caption || currentPost?.title}
      </p>
      {postMedia && (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
          <img src={postMedia.url} alt="Threads visual" className="w-full object-cover max-h-96" />
        </div>
      )}
      <div className="flex items-center gap-4 pt-1 text-slate-400 text-xs">
        <span>❤️ 1.2k</span>
        <span>💬 84</span>
        <span>🔄 32</span>
        <span>✈️ Share</span>
      </div>
    </div>
  );

  const renderYouTubePreview = () => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
          ▶
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">InfiniteTech AI</span>
            <span className="text-[10px] text-slate-400">• 4 hours ago</span>
          </div>
          <span className="text-[10px] text-slate-400">12.4K subscribers</span>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
        {ytPost?.caption || currentPost?.title}
      </p>
      {postMedia && (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
          <img src={postMedia.url} alt="YouTube Community Graphic" className="w-full object-cover max-h-96" />
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="cursor-pointer hover:text-slate-700">👍 420</span>
          <span className="cursor-pointer hover:text-slate-700">👎</span>
        </div>
        <span className="cursor-pointer hover:text-slate-700">💬 38 comments</span>
      </div>
    </div>
  );

  const renderPinterestPreview = () => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm max-w-sm mx-auto">
      {postMedia && (
        <div className="relative group">
          <img src={postMedia.url} alt="Pinterest Pin" className="w-full object-cover" />
          <div className="absolute top-3 right-3">
            <button className="px-3 py-1.5 rounded-full bg-red-600 text-white font-bold text-xs shadow-lg">
              Save
            </button>
          </div>
        </div>
      )}
      <div className="p-4 space-y-2">
        <a
          href={currentPost?.website_url || '#'}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:underline"
        >
          <span>🔗 {currentPost?.website_url?.replace(/^https?:\/\//, '') || 'infinitetechai.com'}</span>
        </a>
        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
          {currentPost?.title}
        </h4>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3">
          {pinPost?.caption || currentPost?.topic}
        </p>
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
            IT
          </div>
          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
            InfiniteTech AI Official
          </span>
        </div>
      </div>
    </div>
  );

  // Checklist calculations
  const hasImage = Boolean(postMedia);
  const isHighRes = postMedia ? ((postMedia.width ?? 0) >= 1000 && (postMedia.height ?? 0) >= 1000) : false;
  const twOver = (twPost?.caption?.length || 0) > 280;
  const hasCaptions = Boolean(fbPost?.caption && igPost?.caption && liPost?.caption && twPost?.caption);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Post Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 border border-indigo-500/20">
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>Multi-Platform Feed Visualizer</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Realistic Post & Image Preview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inspect exactly how your captions, headings, hashtags, and AI-generated graphics will render in user feeds across Facebook, Instagram, LinkedIn, and X.
          </p>
        </div>

        {/* Post Switcher Dropdown & Nav Arrows */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={currentIndex <= 0}
            onClick={handlePrevPost}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
            title="Previous Post"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={selectedPostId || ''}
            onChange={e => {
              const id = Number(e.target.value);
              setSelectedPostId(id);
              navigate(`/preview/${id}`, { replace: true });
            }}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[280px] sm:max-w-[340px] truncate"
          >
            {posts.map((p, idx) => (
              <option key={p.id} value={p.id}>
                #{idx + 1}: {p.title} ({p.status.toUpperCase()})
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={currentIndex >= posts.length - 1}
            onClick={handleNextPost}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
            title="Next Post"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-slate-200 dark:border-slate-800 mx-1 hidden sm:block" />

          <Button
            size="sm"
            variant={currentPost?.status === 'approved' ? 'secondary' : 'primary'}
            icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            onClick={handleApprove}
            loading={approving}
            disabled={currentPost?.status === 'approved'}
            title="Approve post for auto-publishing"
          >
            {currentPost?.status === 'approved' ? 'Approved ✓' : 'Approve Post'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
            onClick={() => setIsStudioModalOpen(true)}
            title="Open Interactive Image Studio & 20-Family Template Engine"
          >
            Design Studio
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`w-3.5 h-3.5 text-cyan-500 ${regeneratingImg ? 'animate-spin' : ''}`} />}
            onClick={handleRegenerateGraphic}
            loading={regeneratingImg}
            title="Auto-rotate template and regenerate marketing image"
          >
            Re-Gen Image
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<Copy className="w-3.5 h-3.5 text-slate-500" />}
            onClick={handleDuplicate}
            loading={duplicating}
            title="Duplicate Post"
          >
            Duplicate
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<Edit3 className="w-3.5 h-3.5 text-indigo-500" />}
            onClick={openEditModal}
          >
            Quick Edit
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={<Send className="w-3.5 h-3.5" />}
            onClick={handlePublishNow}
          >
            Publish Now
          </Button>
        </div>
      </div>

      {/* Control Bar: Network Tabs + Viewport Mode + Action Buttons */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Network Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'facebook', label: 'Facebook', color: 'hover:text-[#1877F2]' },
            { id: 'instagram', label: 'Instagram', color: 'hover:text-[#E4405F]' },
            { id: 'linkedin', label: 'LinkedIn', color: 'hover:text-[#0A66C2]' },
            { id: 'twitter', label: 'X (Twitter)', color: 'hover:text-[#1DA1F2]' },
            { id: 'threads', label: 'Threads', color: 'hover:text-black dark:hover:text-white' },
            { id: 'youtube', label: 'YouTube', color: 'hover:text-[#FF0000]' },
            { id: 'pinterest', label: 'Pinterest', color: 'hover:text-[#BD081C]' },
            { id: 'all', label: 'All Networks (Grid)', color: 'hover:text-indigo-500', icon: Grid },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePlatform(tab.id as PlatformType)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activePlatform === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Viewport and Utility Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop vs Mobile Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewport === 'desktop'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewport === 'mobile'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Frame</span>
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            icon={<Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyCaption}
            title="Copy caption to clipboard"
          >
            Copy Caption
          </Button>
        </div>
      </div>

      {/* Main Content Layout: Previews on Left, Metadata & Asset Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Mockup View */}
        <div className="lg:col-span-8 space-y-6">
          {/* Multi-Platform Grid View */}
          {activePlatform === 'all' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Facebook */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#1877F2]">
                  <span>Facebook Feed Post</span>
                  <Badge variant="facebook" size="sm">FB</Badge>
                </div>
                <FacebookPreview
                  pageName="InfiniteTech AI"
                  caption={fbPost?.caption || ''}
                  mediaUrl={postMedia?.url}
                  websiteUrl={currentPost?.website_url}
                />
              </div>

              {/* Instagram */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#E4405F]">
                  <span>Instagram Feed Post</span>
                  <Badge variant="instagram" size="sm">IG</Badge>
                </div>
                <InstagramPreview
                  accountName="infinitetech.ai"
                  caption={igPost?.caption || ''}
                  mediaUrl={postMedia?.url}
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#0A66C2]">
                  <span>LinkedIn Professional Post</span>
                  <Badge variant="linkedin" size="sm">IN</Badge>
                </div>
                <LinkedInPreview
                  authorName="InfiniteTech AI"
                  tagline="Business Automation • From Chaos to Control"
                  caption={liPost?.caption || ''}
                  mediaUrl={postMedia?.url}
                  websiteUrl={currentPost?.website_url}
                />
              </div>

              {/* Twitter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#1DA1F2]">
                  <span>X (Twitter) Tweet</span>
                  <Badge variant="twitter" size="sm">X</Badge>
                </div>
                <TwitterPreview
                  displayName="InfiniteTech AI"
                  accountHandle="@infinitetech_ai"
                  caption={twPost?.caption || ''}
                  mediaUrl={postMedia?.url}
                />
              </div>

              {/* Threads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Threads Post</span>
                  <Badge variant="neutral" size="sm">@</Badge>
                </div>
                {renderThreadsPreview()}
              </div>

              {/* YouTube */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#FF0000]">
                  <span>YouTube Community Post</span>
                  <Badge variant="error" size="sm">YT</Badge>
                </div>
                {renderYouTubePreview()}
              </div>

              {/* Pinterest */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#BD081C]">
                  <span>Pinterest Pin</span>
                  <Badge variant="warning" size="sm">PIN</Badge>
                </div>
                {renderPinterestPreview()}
              </div>
            </div>
          ) : (
            /* Single Network View with optional Mobile Frame */
            <div className="flex justify-center">
              {viewport === 'mobile' ? (
                /* Mobile Phone Mockup Frame */
                <div className="w-[380px] rounded-[48px] p-3 bg-slate-900 border-[8px] border-slate-800 shadow-2xl relative">
                  {/* Phone Speaker Notch */}
                  <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700"></div>
                  </div>
                  {/* Mobile Screen Surface */}
                  <div className="rounded-[36px] overflow-hidden bg-slate-100 dark:bg-slate-950 max-h-[720px] overflow-y-auto">
                    {/* Status bar */}
                    <div className="px-5 py-2 flex items-center justify-between text-[11px] font-bold text-slate-500 bg-white dark:bg-slate-900">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <span>5G</span>
                        <div className="w-5 h-2.5 rounded border border-slate-500 p-0.5">
                          <div className="w-full h-full bg-slate-500 rounded-sm"></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      {activePlatform === 'facebook' && (
                        <FacebookPreview
                          pageName="InfiniteTech AI"
                          caption={fbPost?.caption || ''}
                          mediaUrl={postMedia?.url}
                          websiteUrl={currentPost?.website_url}
                        />
                      )}
                      {activePlatform === 'instagram' && (
                        <InstagramPreview
                          accountName="infinitetech.ai"
                          caption={igPost?.caption || ''}
                          mediaUrl={postMedia?.url}
                        />
                      )}
                      {activePlatform === 'linkedin' && (
                        <LinkedInPreview
                          authorName="InfiniteTech AI"
                          tagline="Business Automation • Work Less, Achieve More"
                          caption={liPost?.caption || ''}
                          mediaUrl={postMedia?.url}
                          websiteUrl={currentPost?.website_url}
                        />
                      )}
                      {activePlatform === 'twitter' && (
                        <TwitterPreview
                          displayName="InfiniteTech AI"
                          accountHandle="@infinitetech_ai"
                          caption={twPost?.caption || ''}
                          mediaUrl={postMedia?.url}
                        />
                      )}
                      {activePlatform === 'threads' && renderThreadsPreview()}
                      {activePlatform === 'youtube' && renderYouTubePreview()}
                      {activePlatform === 'pinterest' && renderPinterestPreview()}
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop Normal Feed Preview */
                <div className="w-full max-w-xl">
                  {activePlatform === 'facebook' && (
                    <FacebookPreview
                      pageName="InfiniteTech AI"
                      caption={fbPost?.caption || ''}
                      mediaUrl={postMedia?.url}
                      websiteUrl={currentPost?.website_url}
                    />
                  )}
                  {activePlatform === 'instagram' && (
                    <InstagramPreview
                      accountName="infinitetech.ai"
                      caption={igPost?.caption || ''}
                      mediaUrl={postMedia?.url}
                    />
                  )}
                  {activePlatform === 'linkedin' && (
                    <LinkedInPreview
                      authorName="InfiniteTech AI"
                      tagline="Business Automation Suite • Saving 70% Admin Overhead"
                      caption={liPost?.caption || ''}
                      mediaUrl={postMedia?.url}
                      websiteUrl={currentPost?.website_url}
                    />
                  )}
                  {activePlatform === 'twitter' && (
                    <TwitterPreview
                      displayName="InfiniteTech AI"
                      accountHandle="@infinitetech_ai"
                      caption={twPost?.caption || ''}
                      mediaUrl={postMedia?.url}
                    />
                  )}
                  {activePlatform === 'threads' && renderThreadsPreview()}
                  {activePlatform === 'youtube' && renderYouTubePreview()}
                  {activePlatform === 'pinterest' && renderPinterestPreview()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Post Details & Image Asset Inspector */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Attached Image Inspector Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span>Attached Post Graphic</span>
              </h3>
              {postMedia && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              )}
            </div>

            {postMedia ? (
              <div className="space-y-3">
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-square flex items-center justify-center">
                  <img
                    src={postMedia.url}
                    alt={postMedia.alt_text || 'Post graphic'}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(postMedia.url)}
                      className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-bold flex items-center gap-1 shadow-lg hover:bg-white transition"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom Full-Res</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">File:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                      {postMedia.original_filename}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Dimensions:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {postMedia.width} × {postMedia.height} px (1:1 Square)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">File Size:</span>
                    <span>{(postMedia.size_bytes / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Storage Key:</span>
                    <span className="font-mono text-[10px] truncate max-w-[150px]">{postMedia.storage_key}</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Sparkles className="w-3.5 h-3.5" />}
                      onClick={() => setIsStudioModalOpen(true)}
                    >
                      Image Studio
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<RefreshCw className={`w-3.5 h-3.5 text-cyan-500 ${regeneratingImg ? 'animate-spin' : ''}`} />}
                      onClick={handleRegenerateGraphic}
                      loading={regeneratingImg}
                    >
                      AI Re-Gen
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={openEditModal}
                  >
                    Swap / Change Image
                  </Button>
                </div>

                {/* 1-Click Visual Art Gallery Selector */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>1-Click AI Visual Selector</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Tap to apply</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {mediaList
                      .filter(m => m.mime_type.startsWith('image/'))
                      .map(m => {
                        const isSelected = postMedia?.id === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleQuickSelectImage(m)}
                            className={`group p-1.5 rounded-xl border-2 cursor-pointer transition relative flex flex-col items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 ${
                              isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/40'
                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                            }`}
                          >
                            <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-900 relative">
                              <img
                                src={m.url}
                                alt={m.alt_text || m.original_filename}
                                className="w-full h-full object-cover transition group-hover:scale-105"
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                              {m.alt_text || m.original_filename.replace('.jpg', '').replace('.png', '')}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  No image attached to this post
                </p>
                <p className="text-[11px] text-slate-400">
                  Instagram and visual feeds perform significantly better with high-res graphics.
                </p>
                <Button size="sm" variant="outline" onClick={openEditModal}>
                  Attach Graphic
                </Button>
              </div>
            )}
          </div>

          {/* 2. Content Quality & Readiness Checklist */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Publishing Quality Checklist</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  {hasImage ? (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>Marketing Graphic Attached</span>
                </span>
                <span className={`font-semibold ${hasImage ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {hasImage ? 'Attached' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  {isHighRes ? (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">•</span>
                  )}
                  <span>1080×1080 Feed Resolution</span>
                </span>
                <span className="text-slate-500">
                  {postMedia ? `${postMedia.width}×${postMedia.height}` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  {hasCaptions ? (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>4 Platform Captions Generated</span>
                </span>
                <span className="font-semibold text-emerald-600">
                  {currentPost?.platform_posts.length || 0} Platforms
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  {!twOver ? (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>Twitter Limit (≤ 280 chars)</span>
                </span>
                <span className={`font-mono font-semibold ${twOver ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {twPost?.caption?.length || 0} / 280
                </span>
              </div>
            </div>
          </div>

          {/* 3. Post Metadata */}
          {currentPost && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 text-xs text-slate-500">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                Post Metadata
              </h3>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Post ID:</span>
                  <span className="font-mono">#{currentPost.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <Badge variant={currentPost.status === 'scheduled' ? 'warning' : 'success'} size="sm">
                    {currentPost.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Scheduled At:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {fbPost?.scheduled_at ? new Date(fbPost.scheduled_at).toLocaleString() : 'Immediate'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Audience:</span>
                  <span className="truncate max-w-[160px]">{currentPost.target_audience || 'General'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Fullscreen Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="High-res preview"
              className="max-h-[85vh] w-auto rounded-xl shadow-2xl border border-white/20"
              onClick={e => e.stopPropagation()}
            />
            <p className="text-white text-xs mt-3 font-semibold">
              Full Resolution Graphic (1080 × 1080 px)
            </p>
          </div>
        </div>
      )}

      {/* In-line Quick Edit Post & Image Modal */}
      {isEditing && currentPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Quick Edit Post Details & Image
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Post Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Post Heading / Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            {/* Image Selector & Uploader */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Attached Post Graphic
              </label>

              <div className="flex items-center gap-3">
                <select
                  value={editMediaId || ''}
                  onChange={e => setEditMediaId(e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                >
                  <option value="">No Image (Text Only)</option>
                  {mediaList.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.original_filename} ({m.width}x{m.height})
                    </option>
                  ))}
                </select>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleUploadNewImage}
                />

                <Button
                  size="sm"
                  variant="outline"
                  icon={<Upload className="w-3.5 h-3.5" />}
                  loading={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload New
                </Button>
              </div>

              {editMediaId && getMediaById(editMediaId) && (
                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={getMediaById(editMediaId)?.url}
                    alt="Selected graphic"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {getMediaById(editMediaId)?.original_filename}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {getMediaById(editMediaId)?.width} × {getMediaById(editMediaId)?.height} px
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Captions by Network */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Network Specific Captions
              </label>

              {(['facebook', 'instagram', 'linkedin', 'twitter'] as const).map(net => (
                <div key={net} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">
                    <span>{net === 'twitter' ? 'X (Twitter)' : net}</span>
                    <span className="font-mono text-[10px]">
                      {(editCaptions[net] || '').length} chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={editCaptions[net] || ''}
                    onChange={e => setEditCaptions({ ...editCaptions, [net]: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" loading={savingEdit} onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Image Studio Modal */}
      <ImageEditorModal
        isOpen={isStudioModalOpen}
        onClose={() => setIsStudioModalOpen(false)}
        post={currentPost}
        initialMedia={postMedia}
        onMediaSaved={async () => {
          setIsStudioModalOpen(false);
          await loadAllPostsAndMedia();
        }}
      />
    </div>
  );
};
