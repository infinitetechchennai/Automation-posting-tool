import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Sparkles,
  Trash2,
  Copy,
  CheckCircle2,
  Sliders,
  Eye,
  FileCheck,
  AlertCircle,
  Zap,
  Download,
  Layout,
  Palette,
  Maximize2,
  Edit3,
  Calendar,
  Check
} from 'lucide-react';
import { api, MediaItem } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ImageEditorModal } from '../components/image-editor/ImageEditorModal';

export const ImageStudioPage: React.FC = () => {
  const toast = useToast();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Templates & Configuration
  const [templates, setTemplates] = useState<any[]>([]);
  const [palettes, setPalettes] = useState<any[]>([]);

  // Studio Form State
  const [topic, setTopic] = useState('50,000 Calls Every Morning. AI Can.');
  const [description, setDescription] = useState('Automate customer calls, lead follow-ups, reminders and collections with AI Voice Agents.');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(1);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('1:1');
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('teal_brand');
  const [ctaText, setCtaText] = useState('Book a Demo');
  const [bullet1, setBullet1] = useState('More Calls • Never miss a lead');
  const [bullet2, setBullet2] = useState('Fast Follow-ups • Instant CRM sync');
  const [bullet3, setBullet3] = useState('High Conversion • Boost 10x growth');
  const [bullet4, setBullet4] = useState('Multilingual • All languages supported');
  const [engineProvider, setEngineProvider] = useState<'procedural' | 'pollinations'>('procedural');
  const [aiStyle, setAiStyle] = useState<string>('3d_tech');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  // Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);

  // Lightbox Preview Modal
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [media, config] = await Promise.all([
        api.listMedia(),
        api.getFlyerTemplates()
      ]);
      setMediaList(media);
      setTemplates(config.templates);
      setPalettes(config.palettes);
    } catch (err: any) {
      toast.error('Failed to load studio assets', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Topic Required', 'Please enter a headline or topic for the flyer.');
      return;
    }

    setGenerating(true);
    try {
      const benefits = [bullet1, bullet2, bullet3, bullet4].filter(Boolean);
      const res = await api.generateMarketingFlyer({
        topic,
        description,
        details: benefits,
        cta_text: ctaText,
        template_id: selectedTemplateId,
        aspect_ratio: selectedAspectRatio,
        palette_id: selectedPaletteId,
        engine_provider: engineProvider,
        ai_prompt: customPrompt || undefined,
        ai_style: aiStyle
      });

      setMediaList(prev => [res, ...prev]);
      setPreviewMedia(res);
      toast.success(
        engineProvider === 'pollinations' ? 'Free AI Visual Created!' : 'Marketing Flyer Created!',
        engineProvider === 'pollinations'
          ? 'Generated with Pollinations.ai (Flux.1) + sharp typography overlays.'
          : `Rendered template #${selectedTemplateId} with readable typography & CTA.`
      );
    } catch (err: any) {
      toast.error('Generation Failed', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteMedia(id);
      setMediaList(prev => prev.filter(m => m.id !== id));
      toast.success('Media Deleted');
    } catch (err: any) {
      toast.error('Delete Failed', err.message);
    }
  };

  const handleOpenEditor = (media?: MediaItem) => {
    setEditingMedia(media || null);
    setEditorOpen(true);
  };

  const activeTemplateObj = templates.find(t => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold mb-2 border border-teal-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated Multi-Family Visual Engine</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            AI Marketing Image Studio & Generator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inspired by clean corporate advertising — renders 20 distinct design families with 100% readable text layers, clean device mockups, and glowing CTAs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Sliders className="w-4 h-4" />}
            onClick={() => handleOpenEditor()}
          >
            Launch Full Studio Editor
          </Button>
        </div>
      </div>

      {/* Main Grid: Generator Controls + Live Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Generator Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-600" />
              Configure Marketing Flyer
            </h2>
            <Badge variant="teal">Template #{selectedTemplateId}</Badge>
          </div>

          {/* Generation Engine Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span>Rendering Engine</span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                {engineProvider === 'pollinations' ? '✨ Cloud Flux.1 AI' : '⚡ Instant Procedural'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
              <button
                type="button"
                onClick={() => setEngineProvider('procedural')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  engineProvider === 'procedural'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-teal-600" />
                <span>Instant Vector (80ms)</span>
              </button>
              <button
                type="button"
                onClick={() => setEngineProvider('pollinations')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  engineProvider === 'pollinations'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Free AI (Pollinations)</span>
              </button>
            </div>
            {engineProvider === 'pollinations' && (
              <div className="mt-2.5 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" /> AI Visual Style
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/60 px-1.5 py-0.5 rounded">0 API Keys Needed</span>
                </div>
                <select
                  value={aiStyle}
                  onChange={e => setAiStyle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="3d_tech">📱 3D Tech Device on Glowing Podium</option>
                  <option value="cyber_matrix">🌐 Cyber Matrix & Futuristic Hologram</option>
                  <option value="minimal_studio">🏢 Minimalist Clean Studio Product</option>
                  <option value="isometric">🧊 3D Isometric Tech Diorama</option>
                  <option value="photoreal_office">👔 Executive Modern Office Architecture</option>
                </select>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                    Custom Prompt Override (Optional):
                  </label>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder="Leave empty to auto-craft from topic..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Headline */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Image Headline & Hook
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. 50,000 Calls Every Morning. AI Can."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Subheading / Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Supporting Value Text
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Explain what the AI does for the business..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Template Style Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Design Family (20 Styles)
              </label>
              <span className="text-[10px] text-teal-600 font-bold">{activeTemplateObj?.category}</span>
            </div>
            <select
              value={selectedTemplateId}
              onChange={e => {
                const id = Number(e.target.value);
                setSelectedTemplateId(id);
                const t = templates.find(item => item.id === id);
                if (t && t.theme) setSelectedPaletteId(t.theme);
              }}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold text-slate-900 dark:text-slate-100"
            >
              {templates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  Style {tpl.id}: {tpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio & Color Theme */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Aspect Ratio
              </label>
              <select
                value={selectedAspectRatio}
                onChange={e => setSelectedAspectRatio(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="1:1">1:1 Square (1080×1080)</option>
                <option value="4:5">4:5 Portrait (1080×1350)</option>
                <option value="16:9">16:9 Twitter/LinkedIn (1200×675)</option>
                <option value="9:16">9:16 Story (1080×1920)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Color Theme
              </label>
              <select
                value={selectedPaletteId}
                onChange={e => setSelectedPaletteId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                {palettes.map(pal => (
                  <option key={pal.id} value={pal.id}>
                    {pal.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feature Bullet Points */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Feature Badges (Rendered With Vector Icons)
            </label>
            <div className="space-y-1.5">
              <input
                type="text"
                value={bullet1}
                onChange={e => setBullet1(e.target.value)}
                className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                value={bullet2}
                onChange={e => setBullet2(e.target.value)}
                className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Call to Action */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Call To Action Button
            </label>
            <input
              type="text"
              value={ctaText}
              onChange={e => setCtaText(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Generate Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={generating}
            icon={<Sparkles className="w-4 h-4" />}
            onClick={handleGenerate}
          >
            Generate Marketing Flyer
          </Button>
        </div>

        {/* Right Column: Visual Gallery (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-teal-600" />
              Generated Flyer Library ({mediaList.length})
            </h2>
            <span className="text-xs text-slate-500">Auto-saved to media storage</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading assets...
            </div>
          ) : mediaList.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-slate-500">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-sm">No Marketing Graphics Yet</p>
              <p className="text-xs mt-1">Configure and generate your first flyer above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mediaList.map(item => (
                <div
                  key={item.id}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  {/* Image Thumbnail */}
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.alt_text || item.original_filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewMedia(item)}
                        className="p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white transition"
                        title="Zoom In"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditor(item)}
                        className="p-2 rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition"
                        title="Edit in Studio"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <a
                        href={item.url}
                        download
                        className="p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white transition"
                        title="Download PNG"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {item.alt_text || item.original_filename}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>{item.width || 1080}×{item.height || 1080}</span>
                        <span>•</span>
                        <span>{((item.size_bytes || 0) / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => handleOpenEditor(item)}
                        className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        Customize Layout
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <ImageEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialMedia={editingMedia}
        onMediaSaved={saved => {
          setMediaList(prev => [saved, ...prev.filter(m => m.id !== saved.id)]);
        }}
      />

      {/* Lightbox Preview Modal */}
      {previewMedia && (
        <Modal
          isOpen={!!previewMedia}
          onClose={() => setPreviewMedia(null)}
          title={previewMedia.alt_text || 'Marketing Flyer Preview'}
          size="lg"
        >
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[75vh] flex items-center justify-center bg-slate-950">
              <img
                src={previewMedia.url}
                alt="Full Flyer"
                className="max-h-[72vh] object-contain"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Resolution: {previewMedia.width}×{previewMedia.height} • Format: {previewMedia.mime_type}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit3 className="w-4 h-4" />}
                  onClick={() => {
                    const m = previewMedia;
                    setPreviewMedia(null);
                    handleOpenEditor(m);
                  }}
                >
                  Edit in Studio
                </Button>
                <a
                  href={previewMedia.url}
                  download
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
