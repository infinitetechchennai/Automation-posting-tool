import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Sliders,
  Download,
  Save,
  Check,
  RefreshCw,
  Layout,
  Palette,
  Type,
  Image as ImageIcon,
  CheckCircle2,
  Phone,
  Calendar,
  Layers,
  Zap,
  ArrowRight
} from 'lucide-react';
import { api, MediaItem, Post } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  post?: Post | null;
  initialMedia?: MediaItem | null;
  onMediaSaved?: (savedMedia: MediaItem) => void;
}

export const ImageEditorModal: React.FC<ImageEditorProps> = ({
  isOpen,
  onClose,
  post,
  initialMedia,
  onMediaSaved
}) => {
  const toast = useToast();

  // Template and Palette definitions
  const [templates, setTemplates] = useState<any[]>([]);
  const [palettes, setPalettes] = useState<any[]>([]);
  const [aspectRatios, setAspectRatios] = useState<any[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Editor Form Fields
  const [activeTab, setActiveTab] = useState<'template' | 'text' | 'colors' | 'ai'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(1);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('1:1');
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('teal_brand');

  const [headline, setHeadline] = useState('50,000 Calls Every Morning. AI Can.');
  const [description, setDescription] = useState('Automate customer calls, lead follow-ups, reminders and collections with AI Voice Agents.');
  const [benefit1, setBenefit1] = useState('More Calls • Never miss a lead');
  const [benefit2, setBenefit2] = useState('Fast Follow-ups • Instant CRM sync');
  const [benefit3, setBenefit3] = useState('High Conversion • Boost 10x growth');
  const [benefit4, setBenefit4] = useState('Multilingual • All languages supported');
  const [ctaText, setCtaText] = useState('Book a Demo');
  const [company, setCompany] = useState('InfiniteTech AI');
  const [website, setWebsite] = useState('www.infinitetechai.com');
  const [phone, setPhone] = useState('+91-9884777171');

  // AI Diffusion options
  const [engineProvider, setEngineProvider] = useState<'procedural' | 'pollinations'>('procedural');
  const [aiStyle, setAiStyle] = useState<string>('3d_tech');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Preview & Render Status
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>('');
  const [currentMediaItem, setCurrentMediaItem] = useState<MediaItem | null>(null);
  const [rendering, setRendering] = useState(false);
  const [aiImproving, setAiImproving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      if (post) {
        setHeadline(post.title || post.topic || '50,000 Calls Every Morning. AI Can.');
        if (post.website_url) setWebsite(post.website_url);
        try {
          const pkg = post.content_json as any;
          if (pkg) {
            if (pkg.description) setDescription(pkg.description);
            if (pkg.call_to_action) setCtaText(pkg.call_to_action);
            if (Array.isArray(pkg.key_benefits) && pkg.key_benefits.length > 0) {
              setBenefit1(pkg.key_benefits[0] || benefit1);
              if (pkg.key_benefits[1]) setBenefit2(pkg.key_benefits[1]);
              if (pkg.key_benefits[2]) setBenefit3(pkg.key_benefits[2]);
              if (pkg.key_benefits[3]) setBenefit4(pkg.key_benefits[3]);
            }
          }
        } catch (e) {}
      }
      if (initialMedia) {
        setCurrentMediaItem(initialMedia);
        setCurrentMediaUrl(initialMedia.url);
      }
    }
  }, [isOpen, post, initialMedia]);

  const loadTemplates = async () => {
    setLoadingConfig(true);
    try {
      const data = await api.getFlyerTemplates();
      setTemplates(data.templates);
      setPalettes(data.palettes);
      setAspectRatios(data.aspect_ratios);
    } catch (e) {
      console.error('Failed to load templates config:', e);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleRenderLiveFlyer = async () => {
    setRendering(true);
    try {
      const benefitsList = [benefit1, benefit2, benefit3, benefit4].filter(Boolean);
      const res = await api.generateMarketingFlyer({
        topic: headline,
        description,
        details: benefitsList,
        cta_text: ctaText,
        company,
        website,
        phone,
        template_id: selectedTemplateId,
        aspect_ratio: selectedAspectRatio,
        palette_id: selectedPaletteId,
        engine_provider: engineProvider,
        ai_prompt: customPrompt || undefined,
        ai_style: aiStyle
      });

      setCurrentMediaItem(res);
      setCurrentMediaUrl(res.url);
      toast.success(
        engineProvider === 'pollinations' ? 'Free AI Design Rendered!' : 'New Design Rendered!',
        engineProvider === 'pollinations'
          ? 'Generated with Pollinations.ai (Flux.1) + sharp typography.'
          : `Applied Template ${selectedTemplateId} successfully.`
      );
    } catch (err: any) {
      toast.error('Render Failed', err.message || 'Could not generate flyer.');
    } finally {
      setRendering(false);
    }
  };

  const handleAiImprove = async () => {
    setAiImproving(true);
    try {
      // Craft high-converting variant hooks
      const res = await api.improveCaption(headline, 'improve', 'Marketing');
      if (res && res.improved) {
        const shortHook = res.improved.split('\n')[0].replace(/"/g, '').trim();
        setHeadline(shortHook.slice(0, 75));
        toast.success('AI Enhanced Headline!', 'Generated punchy, high-converting marketing hook.');
      }
    } catch (e: any) {
      toast.error('AI Suggestion Failed', e.message);
    } finally {
      setAiImproving(false);
    }
  };

  const handleSaveAndApply = async () => {
    if (!currentMediaItem) {
      await handleRenderLiveFlyer();
    }
    if (post && currentMediaItem) {
      try {
        const platformPostsUpdates = post.platform_posts.map(pp => ({
          id: pp.id,
          platform: pp.platform,
          caption: pp.caption,
          media_ids: [currentMediaItem.id]
        }));

        await api.updatePost(post.id, {
          title: headline,
          media_ids: [currentMediaItem.id],
          platform_posts: platformPostsUpdates
        });

        toast.success('Design Saved to Post!', 'Attached new visual to all social channels.');
      } catch (e: any) {
        toast.error('Save to post failed', e.message);
      }
    }

    if (currentMediaItem && onMediaSaved) {
      onMediaSaved(currentMediaItem);
    }
    onClose();
  };

  const handleDownload = () => {
    if (!currentMediaUrl) {
      toast.warning('No image to download', 'Please render a flyer first.');
      return;
    }
    const a = document.createElement('a');
    a.href = currentMediaUrl;
    a.download = `SocialFlyer_${headline.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download Started', 'Saving marketing image.');
  };

  if (!isOpen) return null;

  const activeTemplateObj = templates.find(t => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                AI Social Image Studio & Design Engine
                <Badge variant="teal">20 Design Families</Badge>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Custom marketing flyers inspired by corporate advertising with 100% readable text layers & vector icons.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={handleDownload}
              disabled={!currentMediaUrl}
            >
              Download
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Check className="w-4 h-4" />}
              onClick={handleSaveAndApply}
            >
              Save & Apply to Post
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: 2 Columns (Left Canvas Preview, Right Controls) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Canvas Preview Area */}
          <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-950/60 p-6 flex flex-col items-center justify-center relative overflow-y-auto">
            {/* Aspect Ratio Selector Pills */}
            <div className="flex items-center gap-2 mb-4 bg-white/80 dark:bg-slate-900/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm z-10">
              {['1:1', '4:5', '16:9', '9:16'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setSelectedAspectRatio(ratio)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedAspectRatio === ratio
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            {/* Live Canvas View */}
            <div className="relative max-w-full max-h-[70vh] flex items-center justify-center">
              {currentMediaUrl ? (
                <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-slate-800">
                  <img
                    src={currentMediaUrl}
                    alt="Rendered Marketing Graphic"
                    className="max-h-[64vh] object-contain transition-transform duration-200"
                  />
                  {rendering && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                      <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mb-2" />
                      <span className="text-sm font-bold">Rendering New Composition...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-[380px] h-[380px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 text-center p-6 bg-white/40 dark:bg-slate-900/40">
                  <ImageIcon className="w-12 h-12 mb-3 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Image Rendered Yet</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Click below to render using the selected template & text</p>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={rendering}
                    icon={<Sparkles className="w-4 h-4" />}
                    onClick={handleRenderLiveFlyer}
                  >
                    Render First Design
                  </Button>
                </div>
              )}
            </div>

            {/* Bottom Render Trigger Bar */}
            <div className="mt-4 flex items-center gap-3 z-10">
              <Button
                variant="primary"
                size="md"
                loading={rendering}
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={handleRenderLiveFlyer}
              >
                Re-Render Live Design
              </Button>
              {activeTemplateObj && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Active Style: <span className="font-bold text-slate-900 dark:text-slate-100">{activeTemplateObj.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="lg:col-span-5 border-l border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
            {/* Sub-tabs header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 shrink-0">
              {[
                { id: 'template', label: 'Templates (20)', icon: Layout },
                { id: 'text', label: 'Copy & Content', icon: Type },
                { id: 'colors', label: 'Brand & Colors', icon: Palette },
                { id: 'ai', label: 'AI Visuals (Flux.1)', icon: Sparkles },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: TEMPLATES */}
              {activeTab === 'template' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Choose From 20 Design Families
                    </h3>
                    <Badge variant="outline">Non-Repeating</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Every generated image uses a distinct layout, varying between split-screen, centered devices, editorial Swiss, cyber dark, and KPI metrics.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[56vh] overflow-y-auto pr-1">
                    {templates.map(tpl => {
                      const isSelected = selectedTemplateId === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => {
                            setSelectedTemplateId(tpl.id);
                            if (tpl.theme) setSelectedPaletteId(tpl.theme);
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-500/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                              Style #{tpl.id}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {tpl.name}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {tpl.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: TEXT & COPY */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Main Image Headline
                      </label>
                      <button
                        onClick={handleAiImprove}
                        disabled={aiImproving}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{aiImproving ? 'Improving...' : 'AI Improve'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={headline}
                      onChange={e => setHeadline(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Supporting Description
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Feature Benefit Bullets (Rendered as Vector Icons)
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={benefit1}
                        onChange={e => setBenefit1(e.target.value)}
                        placeholder="Bullet point 1"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        value={benefit2}
                        onChange={e => setBenefit2(e.target.value)}
                        placeholder="Bullet point 2"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        value={benefit3}
                        onChange={e => setBenefit3(e.target.value)}
                        placeholder="Bullet point 3"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        value={benefit4}
                        onChange={e => setBenefit4(e.target.value)}
                        placeholder="Bullet point 4"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Call to Action (CTA) Button
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={e => setCtaText(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: BRAND & COLORS */}
              {activeTab === 'colors' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                      Color Theme Palette
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {palettes.map(pal => (
                        <button
                          key={pal.id}
                          onClick={() => setSelectedPaletteId(pal.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                            selectedPaletteId === pal.id
                              ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {pal.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={e => setCompany(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        Website URL
                      </label>
                      <input
                        type="text"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Contact / Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: FREE AI (POLLINATIONS) */}
              {activeTab === 'ai' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <h4 className="text-xs font-bold text-teal-950 dark:text-teal-200">
                        Free Cloud AI Visual Generator
                      </h4>
                    </div>
                    <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80">
                      Powered by Pollinations.ai with FLUX.1. Generates photorealistic 3D subjects & tech backgrounds with zero API keys required.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                      Rendering Engine
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setEngineProvider('procedural')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          engineProvider === 'procedural'
                            ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-700'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-teal-600" />
                        <span>Instant Vector</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEngineProvider('pollinations')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          engineProvider === 'pollinations'
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Free AI (Flux.1)</span>
                      </button>
                    </div>
                  </div>

                  {engineProvider === 'pollinations' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                          AI Visual Subject Style
                        </label>
                        <select
                          value={aiStyle}
                          onChange={e => setAiStyle(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                        >
                          <option value="3d_tech">📱 3D Tech Device on Glowing Podium</option>
                          <option value="cyber_matrix">🌐 Cyber Matrix & Futuristic Hologram</option>
                          <option value="minimal_studio">🏢 Minimalist Clean Studio Product</option>
                          <option value="isometric">🧊 3D Isometric Tech Diorama</option>
                          <option value="photoreal_office">👔 Executive Modern Office Architecture</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                          Custom Prompt Override (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={customPrompt}
                          onChange={e => setCustomPrompt(e.target.value)}
                          placeholder="e.g. A futuristic 3D smartphone floating above a neon glass desk with glowing cyber notifications..."
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Leave empty to automatically craft an optimal prompt from your headline.
                        </span>
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        loading={rendering}
                        icon={<Sparkles className="w-4 h-4" />}
                        onClick={handleRenderLiveFlyer}
                        className="w-full"
                      >
                        Generate Visual with Pollinations.ai
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Panel Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={rendering}
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={handleRenderLiveFlyer}
              >
                Apply Changes & Render
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
