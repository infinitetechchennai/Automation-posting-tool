import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Clock,
  Save,
  RefreshCw,
  Copy,
  Paperclip,
  Check,
  AlertCircle,
  Eye,
  Sliders,
  ChevronDown,
  Image as ImageIcon,
  Wand2,
  CheckCircle2,
  Share2,
  FileText,
  LayoutGrid,
  Zap,
  ArrowRight
} from 'lucide-react';
import { api, CompleteContentPackage, PlatformPostContent, MediaItem } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FacebookPreview } from '../components/previews/FacebookPreview';
import { InstagramPreview } from '../components/previews/InstagramPreview';
import { LinkedInPreview } from '../components/previews/LinkedInPreview';
import { TwitterPreview } from '../components/previews/TwitterPreview';
import { PublishConfirmModal } from '../components/publish/PublishConfirmModal';
import { ScheduleModal } from '../components/publish/ScheduleModal';
import { ImageEditorModal } from '../components/image-editor/ImageEditorModal';

const OBJECTIVES = [
  'Generate leads',
  'Increase brand awareness',
  'Drive website traffic',
  'Promote a product',
  'Announce a launch',
  'Educate the audience',
  'Increase engagement',
  'Promote an event',
  'Recruit employees',
];

const TONES = [
  'Professional',
  'Corporate',
  'Friendly',
  'Educational',
  'Marketing',
  'Luxury',
  'Technical',
  'Minimal',
  'Bold',
  'Inspirational',
];

const LANGUAGES = [
  'English',
  'Tamil',
  'Hindi',
  'Custom',
];

const CTA_OPTIONS = [
  'Book a Demo',
  'Contact Us',
  'Learn More',
  'Visit Website',
  'Get Started',
  'Call Now',
  'Download Now',
  'Request a Quote',
  'Custom CTA',
];

const CONTENT_TYPES = [
  'Promotional post',
  'Educational post',
  'Product announcement',
  'Company announcement',
  'Blog promotion',
  'Industry insight',
  'Event announcement',
  'Recruitment post',
  'FAQ',
  'Seasonal content',
];

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Workflow Step (Section 45: 7-Step UX)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [topic, setTopic] = useState('');
  const [postDetails, setPostDetails] = useState('');
  const [companyName, setCompanyName] = useState("Demo User's Brand");
  const [companyDescription, setCompanyDescription] = useState('AI automation and modern business growth suite');
  const [productService, setProductService] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('https://www.infinitetechai.com');
  const [targetAudience, setTargetAudience] = useState('Business Owners & Operations Directors');
  const [marketingObjective, setMarketingObjective] = useState(OBJECTIVES[1]);
  const [industry, setIndustry] = useState('Technology');
  const [tone, setTone] = useState(TONES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [customLanguage, setCustomLanguage] = useState('');
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [keywords, setKeywords] = useState('');
  const [offer, setOffer] = useState('');
  const [selectedCta, setSelectedCta] = useState(CTA_OPTIONS[0]);
  const [customCta, setCustomCta] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // UI Model & Image Design Selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | 'auto'>('auto');
  const [selectedEngineProvider, setSelectedEngineProvider] = useState<'procedural' | 'pollinations'>('procedural');
  const [selectedAiStyle, setSelectedAiStyle] = useState<string>('3d_tech');

  // Selected Target Platforms (all 7 supported)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'facebook',
    'instagram',
    'linkedin',
    'twitter',
    'threads',
    'youtube',
    'pinterest',
  ]);

  // Generated Content State
  const [packageData, setPackageData] = useState<CompleteContentPackage | null>(null);
  const [activeTab, setActiveTab] = useState<'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'threads' | 'youtube' | 'pinterest'>('facebook');
  const [platformPosts, setPlatformPosts] = useState<Record<string, PlatformPostContent>>({});

  // Media & Image Editor
  const [availableMedia, setAvailableMedia] = useState<MediaItem[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Generation Statuses
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regeneratingSingle, setRegeneratingSingle] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Load brand settings to prefill inputs
  useEffect(() => {
    api.getBrandSettings().then(b => {
      if (b) {
        if (b.company_name) setCompanyName(b.company_name);
        if (b.company_description) setCompanyDescription(b.company_description);
        if (b.website) setWebsiteUrl(b.website);
        if (b.industry) setIndustry(b.industry);
        if (b.target_audience) setTargetAudience(b.target_audience);
        if (b.writing_tone) setTone(b.writing_tone);
        if (b.preferred_language) setLanguage(b.preferred_language);
        if (b.default_cta) setSelectedCta(b.default_cta);
      }
    }).catch(() => {});

    api.listMedia().then(setAvailableMedia).catch(() => {});
  }, []);

  const togglePlatformSelector = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter(item => item !== p));
      } else {
        toast.warning('At least one platform must be selected');
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const getEffectiveCta = () => (selectedCta === 'Custom CTA' ? customCta : selectedCta) || 'Book a Demo';
  const getEffectiveLanguage = () => (language === 'Custom' ? customLanguage : language) || 'English';

  const handleGeneratePackage = async () => {
    if (!topic.trim()) {
      toast.error('Post Title is required', 'Please enter what you want to post about.');
      return null;
    }

    setGenerating(true);
    try {
      const kwList = keywords.trim() ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
      const res = await api.generatePost({
        topic,
        company_name: companyName,
        company_description: postDetails ? `${companyDescription} Details: ${postDetails}` : companyDescription,
        product_service: productService.trim() || undefined,
        website_url: websiteUrl,
        target_audience: targetAudience,
        marketing_objective: marketingObjective,
        industry,
        tone,
        language: getEffectiveLanguage(),
        content_type: contentType,
        keywords: kwList,
        offer,
        call_to_action: getEffectiveCta(),
        additional_instructions: additionalInstructions,
        platforms: selectedPlatforms,
      });

      setPackageData(res);
      setPlatformPosts(res.platform_posts);
      if (selectedPlatforms.length > 0) {
        setActiveTab(selectedPlatforms[0] as any);
      }
      setCurrentStep(2);
      toast.success('Social-Media Content Generated!', 'Multi-platform captions, hashtags, and keywords ready.');
      return res;
    } catch (err: any) {
      toast.error('Generation Error', err.message || 'Failed to generate package');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!topic.trim()) {
      toast.error('Post Title is required', 'Please enter a post title first.');
      return null;
    }

    setGeneratingImage(true);
    try {
      const bulletDetails = postDetails
        ? postDetails.split(/;|\n|•/).map(d => d.trim()).filter(Boolean)
        : packageData?.key_points;

      const flyer = await api.generateMarketingFlyer({
        topic,
        description: postDetails || packageData?.description || `Accelerate your ${topic} with intelligent autonomous workflows.`,
        details: bulletDetails && bulletDetails.length > 0 ? bulletDetails : undefined,
        cta_text: getEffectiveCta(),
        company: companyName,
        website: websiteUrl,
        template_id: selectedTemplateId === 'auto' ? undefined : Number(selectedTemplateId),
        engine_provider: selectedEngineProvider,
        ai_style: selectedAiStyle,
      });

      setAvailableMedia(prev => [flyer, ...prev]);
      setSelectedMediaId(flyer.id);
      setCurrentStep(3);
      toast.success('Branded Marketing Image Generated!', 'Rendered with legible typography and modern composition.');
      return flyer;
    } catch (err: any) {
      toast.error('Image Generation Failed', err.message);
      return null;
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateCompletePost = async () => {
    if (!topic.trim()) {
      toast.error('Post Title is required');
      return;
    }
    const pkg = await handleGeneratePackage();
    const img = await handleGenerateImage();
    if (pkg && img) {
      setCurrentStep(4);
      toast.success('Complete Post Ready!', 'Captions and marketing graphic generated. Ready to review and schedule.');
    }
  };

  const handleGenerateAndSchedule = async () => {
    if (!topic.trim()) {
      toast.error('Post Title is required');
      return;
    }

    setGeneratingSchedule(true);
    try {
      await handleGeneratePackage();
      await handleGenerateImage();
      const saved = await handleSaveDraft();
      if (saved) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        await api.schedulePost(saved.id, tomorrow.toISOString(), 'Asia/Kolkata');
        toast.success('Generated & Scheduled!', 'One-click workflow complete. Post set to NEEDS REVIEW according to approval rules.');
        navigate('/preview/' + saved.id);
      }
    } catch (err: any) {
      toast.error('One-Click Workflow Failed', err.message);
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const handleUpdateCurrentCaption = (newCaption: string) => {
    setPlatformPosts(prev => {
      const current = prev[activeTab];
      if (!current) return prev;
      return {
        ...prev,
        [activeTab]: {
          ...current,
          caption: newCaption,
          character_count: newCaption.length,
          is_valid_length: activeTab === 'twitter' ? newCaption.length <= 280 : true,
        },
      };
    });
  };

  const handleRegenerateCurrentPlatform = async () => {
    setRegeneratingSingle(true);
    try {
      const res = await api.regeneratePlatformContent({
        platform: activeTab,
        topic,
        company_name: companyName,
        target_audience: targetAudience,
        tone,
        language,
      });
      setPlatformPosts(prev => ({
        ...prev,
        [activeTab]: res,
      }));
      toast.success(`Regenerated ${activeTab.toUpperCase()} content`);
    } catch (err: any) {
      toast.error('Regeneration Error', err.message);
    } finally {
      setRegeneratingSingle(false);
    }
  };

  const copyCurrentCaption = () => {
    const text = platformPosts[activeTab]?.caption;
    if (text) {
      navigator.clipboard.writeText(text);
      toast.info('Copied to clipboard', `${activeTab.toUpperCase()} caption copied.`);
    }
  };

  const handleSaveDraft = async () => {
    if (!topic.trim()) {
      toast.error('Cannot save', 'Please enter a topic first.');
      return;
    }

    setSaving(true);
    try {
      const platformPayload = Object.entries(platformPosts).map(([pName, pData]) => ({
        platform: pName,
        caption: pData.caption,
        description: pData.description || '',
        hashtags: pData.hashtags || [],
        mentions: pData.mentions || [],
        media_ids: selectedMediaId ? [selectedMediaId] : [],
      }));

      const res = await api.createPost({
        title: packageData?.title || topic,
        topic,
        website_url: websiteUrl,
        target_audience: targetAudience,
        marketing_goal: marketingObjective,
        content_json: packageData || { topic, title: topic },
        platform_posts: platformPayload,
      });

      toast.success('Draft Saved!', `Post saved with ${res.platform_posts.length} platform versions.`);
      return res;
    } catch (err: any) {
      toast.error('Save Draft Failed', err.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const triggerPublishNow = async (selectedIds?: number[]) => {
    const saved = await handleSaveDraft();
    if (!saved) return;

    try {
      const pubRes = await api.publishNow(saved.id, selectedIds);
      toast.success('Publishing Triggered!', `Overall status: ${pubRes.overall_status.toUpperCase()}`);
      navigate('/published');
    } catch (err: any) {
      toast.error('Publishing Failed', err.message);
    }
  };

  const triggerSchedule = async (scheduledAtIso: string, tz: string) => {
    const saved = await handleSaveDraft();
    if (!saved) return;

    try {
      await api.schedulePost(saved.id, scheduledAtIso, tz);
      toast.success('Scheduled Successfully!', `Post queued for publication in ${tz}.`);
      navigate('/scheduled');
    } catch (err: any) {
      toast.error('Scheduling Failed', err.message);
    }
  };

  const selectedMediaObj = availableMedia.find(m => m.id === selectedMediaId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>AI Content Studio & Post Creator</span>
            <Badge variant="success" size="sm">V1 Production Ready</Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bulk-enter details, craft platform-tailored copy, render unique branded marketing flyers, and auto-publish or schedule.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSaveDraft}
            loading={saving}
          >
            Save Draft
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            onClick={() => setShowScheduleModal(true)}
            disabled={!packageData}
          >
            ⚡ Schedule Auto-Post
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Send className="w-4 h-4" />}
            onClick={() => setShowPublishModal(true)}
            disabled={!packageData}
          >
            Publish Now
          </Button>
        </div>
      </div>

      {/* Visual Step Indicator (Mandated by Section 45: 7-Step UX) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[760px] gap-2">
          {[
            { step: 1, label: '1. Title & Details', desc: 'Enter topic specs' },
            { step: 2, label: '2. AI Content', desc: 'Captions & tags' },
            { step: 3, label: '3. AI Image', desc: 'Branded visual flyer' },
            { step: 4, label: '4. Review & Edit', desc: 'Inspect & refine' },
            { step: 5, label: '5. Select Accounts', desc: '7 Social networks' },
            { step: 6, label: '6. Publish / Schedule', desc: 'Auto or queue' },
            { step: 7, label: '7. Track Results', desc: 'Logs & metrics' },
          ].map((item, idx) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <React.Fragment key={item.step}>
                <div
                  onClick={() => setCurrentStep(item.step)}
                  className={`flex items-center gap-2 cursor-pointer transition select-none ${
                    isCurrent
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : isCompleted
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-500/30'
                        : isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : item.step}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold leading-tight whitespace-nowrap">{item.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight whitespace-nowrap">{item.desc}</div>
                  </div>
                </div>
                {idx < 6 && (
                  <div
                    className={`flex-1 h-0.5 min-w-[12px] transition ${
                      currentStep > item.step
                        ? 'bg-emerald-500'
                        : currentStep === item.step
                        ? 'bg-indigo-500/50'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (Mandated by Section 4 & Section 1) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Post Generation Parameters
            </h2>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
              Section 4 & 1
            </span>
          </div>

          {/* Post Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Post Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. AI Calling Agent for Business"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Post Details / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Post Details / Specifications
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Automate customer calls, reminders, follow-ups and collections using AI voice agents."
              value={postDetails}
              onChange={e => setPostDetails(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Tone & Language Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Content Tone
              </label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TONES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Custom Language */}
          {language === 'Custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specify Custom Language
              </label>
              <input
                type="text"
                placeholder="e.g. Spanish, German, Japanese"
                value={customLanguage}
                onChange={e => setCustomLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* CTA Dropdown & Custom CTA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Call To Action (CTA)
              </label>
              <select
                value={selectedCta}
                onChange={e => setSelectedCta(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CTA_OPTIONS.map(cta => (
                  <option key={cta} value={cta}>{cta}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Custom CTA Input */}
          {selectedCta === 'Custom CTA' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custom CTA Text
              </label>
              <input
                type="text"
                placeholder="e.g. Claim Your 14-Day Pilot"
                value={customCta}
                onChange={e => setCustomCta(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Keywords & Website URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keywords (comma separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Website URL
              </label>
              <input
                type="text"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Target Audience & Company Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Audience
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Target Publishing Platforms (all 7 supported) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Publishing Platforms ({selectedPlatforms.length}/7)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlatforms(['facebook', 'instagram', 'linkedin', 'twitter', 'threads', 'youtube', 'pinterest'])}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedPlatforms(['facebook'])}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'facebook', label: 'Facebook' },
                { key: 'instagram', label: 'Instagram' },
                { key: 'linkedin', label: 'LinkedIn' },
                { key: 'twitter', label: 'X (Twitter)' },
                { key: 'threads', label: 'Threads' },
                { key: 'youtube', label: 'YouTube' },
                { key: 'pinterest', label: 'Pinterest' },
              ].map(p => {
                const checked = selectedPlatforms.includes(p.key);
                return (
                  <div
                    key={p.key}
                    onClick={() => togglePlatformSelector(p.key)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition select-none ${
                      checked
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>{p.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual UI Model & Image Design Selector */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                Image Design & UI Model
              </label>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                {selectedEngineProvider === 'pollinations' ? 'Free AI Flux.1' : 'Procedural UI Model'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'auto', label: '🎲 Auto-Rotate (Diverse Style)', desc: 'Different layout every generation' },
                { id: 9, label: '💻 SaaS Dashboard UI (No Phone)', desc: 'Desktop web app window & charts' },
                { id: 5, label: '✨ Minimal Swiss Luxury (No Phone)', desc: 'High-end architectural editorial' },
                { id: 12, label: '📊 Big Data Impact (No Phone)', desc: 'Radial gauges & performance bars' },
                { id: 4, label: '⚡ Obsidian Cyber Matrix (No Phone)', desc: 'Neon dark terminal & neural HUD' },
                { id: 1, label: '📱 3D Mobile App Showcase', desc: 'Smartphone on 3D podium' },
                { id: 'pollinations', label: '🤖 Free AI Flux.1 Visual (Pollinations)', desc: '100% Free photorealistic AI art' },
              ].map(opt => {
                const isSelected = opt.id === 'pollinations'
                  ? selectedEngineProvider === 'pollinations'
                  : selectedEngineProvider !== 'pollinations' && selectedTemplateId === opt.id;

                return (
                  <button
                    key={String(opt.id)}
                    type="button"
                    onClick={() => {
                      if (opt.id === 'pollinations') {
                        setSelectedEngineProvider('pollinations');
                      } else {
                        setSelectedEngineProvider('procedural');
                        setSelectedTemplateId(opt.id as any);
                      }
                    }}
                    className={`text-left p-2 rounded-lg border transition text-xs flex flex-col gap-0.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/60 font-bold text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-[11px] leading-tight">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            {selectedEngineProvider === 'pollinations' && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">AI Art Style:</span>
                <select
                  value={selectedAiStyle}
                  onChange={e => setSelectedAiStyle(e.target.value)}
                  className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="3d_tech">3D Futuristic Tech</option>
                  <option value="photorealistic">Photorealistic Studio</option>
                  <option value="minimal">Minimalist Modern</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons Mandated by Section 4 */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="md"
                icon={<Sparkles className="w-4 h-4 text-indigo-600" />}
                onClick={handleGeneratePackage}
                loading={generating}
                className="w-full"
              >
                Generate Content
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={<ImageIcon className="w-4 h-4 text-emerald-600" />}
                onClick={handleGenerateImage}
                loading={generatingImage}
                className="w-full"
              >
                Generate Image
              </Button>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full shadow-lg shadow-indigo-500/25"
              icon={<Wand2 className="w-4 h-4" />}
              onClick={handleGenerateCompletePost}
              loading={generating || generatingImage}
            >
              Generate Complete Post
            </Button>

            {/* Section 46 One-Click Workflow */}
            <button
              type="button"
              onClick={handleGenerateAndSchedule}
              disabled={generatingSchedule}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>⚡ Generate & Schedule (1-Click Workflow)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Platform Editor & Previews (Mandated by Section 7 & 8) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Branded Marketing Image Inspector Card */}
          {selectedMediaObj && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Generated Marketing Flyer
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {selectedMediaObj.width} × {selectedMediaObj.height} px • High Resolution Crisp Typography
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${generatingImage ? 'animate-spin' : ''}`} />}
                    onClick={handleGenerateImage}
                    loading={generatingImage}
                  >
                    AI Re-Gen
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Sliders className="w-3.5 h-3.5" />}
                    onClick={() => setIsEditorOpen(true)}
                  >
                    Launch Image Studio
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="relative group shrink-0 w-36 h-36 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer" onClick={() => setIsEditorOpen(true)}>
                  <img
                    src={selectedMediaObj.url}
                    alt="Generated Marketing Flyer"
                    className="w-full h-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="text-[11px] font-bold text-white bg-slate-900/80 px-2 py-1 rounded-md shadow-sm">
                      Edit Flyer
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo" size="sm">Style: Modern Corporate AI</Badge>
                    <Badge variant="success" size="sm">Legible Vector Text</Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {selectedMediaObj.original_filename}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Visual composition with high-contrast typography, benefit bullets, clear CTA, and brand footer.
                  </p>
                  <div className="pt-1 flex items-center gap-3 text-[10px] text-slate-400">
                    <span>✓ Brand colors applied</span>
                    <span>✓ Anti-overlap margins</span>
                    <span>✓ 1080×1080 / 1:1 format</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs for Platforms */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['facebook', 'instagram', 'linkedin', 'twitter', 'threads', 'youtube', 'pinterest'] as const).map(p => {
                  const isActive = activeTab === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setActiveTab(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Badge variant={p as any} size="sm">
                        {p === 'twitter' ? 'X' : p.charAt(0).toUpperCase()}
                      </Badge>
                      <span>
                        {p === 'twitter' ? 'X (Twitter)' : p.charAt(0).toUpperCase() + p.slice(1)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                    showPreview
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                  title="Toggle Mockup Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={copyCurrentCaption}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 text-xs flex items-center gap-1.5"
                  title="Copy caption"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleRegenerateCurrentPlatform}
                  disabled={regeneratingSingle || !packageData}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 text-xs flex items-center gap-1.5 disabled:opacity-50"
                  title="Regenerate this platform"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSingle ? 'animate-spin' : ''}`} />
                  <span>Regen</span>
                </button>
              </div>
            </div>

            {/* Platform Editor Content */}
            <div className="pt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {activeTab.toUpperCase()} Tailored Caption & Hook
                  </label>
                  <span className={`text-[11px] font-mono ${
                    activeTab === 'twitter' && (platformPosts[activeTab]?.caption.length || 0) > 280
                      ? 'text-rose-500 font-bold'
                      : 'text-slate-400'
                  }`}>
                    {platformPosts[activeTab]?.caption.length || 0}
                    {activeTab === 'twitter' ? ' / 280 max' : ' characters'}
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={platformPosts[activeTab]?.caption || ''}
                  onChange={e => handleUpdateCurrentCaption(e.target.value)}
                  placeholder={`Generate content package or type ${activeTab} tailored copy here...`}
                  className="w-full p-3 text-xs leading-relaxed bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              {/* Hashtag List */}
              {platformPosts[activeTab]?.hashtags && platformPosts[activeTab]!.hashtags.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Platform Hashtags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {platformPosts[activeTab]!.hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-medium border border-slate-200 dark:border-slate-700"
                      >
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attach Media selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attach Media to Post
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMediaId || ''}
                    onChange={e => setSelectedMediaId(e.target.value ? Number(e.target.value) : null)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No media attached (Text only)</option>
                    {availableMedia.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.original_filename} ({m.width ? `${m.width}x${m.height}` : m.mime_type})
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Sliders className="w-3.5 h-3.5" />}
                    onClick={() => setIsEditorOpen(true)}
                  >
                    Image Studio
                  </Button>
                </div>
              </div>

              {/* Platform specific notes */}
              {activeTab === 'instagram' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                  <strong>Instagram Notice:</strong> Instagram strictly requires media (image/video) to publish. URLs in captions are not clickable.
                </div>
              )}

              {activeTab === 'twitter' && (
                <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200/60 dark:border-sky-900/40 text-xs text-sky-800 dark:text-sky-300">
                  <strong>X Notice:</strong> Strict 280-character limit enforced. Content will never be silently truncated.
                </div>
              )}

              {activeTab === 'threads' && (
                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl border border-violet-200/60 dark:border-violet-900/40 text-xs text-violet-800 dark:text-violet-300">
                  <strong>Threads Notice:</strong> Max 500 characters. Conversational hooks perform best.
                </div>
              )}
            </div>
          </div>

          {/* Live Mockup Previews Mandated by Section 8 */}
          {showPreview && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live {activeTab.toUpperCase()} Mockup Preview
                </h3>
                <span className="text-[10px] text-slate-400">
                  Visual styling mirrors actual network feed
                </span>
              </div>

              {activeTab === 'facebook' && (
                <FacebookPreview
                  pageName={companyName ? `${companyName} Official` : 'SocialPilot Page'}
                  caption={platformPosts.facebook?.caption || ''}
                  mediaUrl={selectedMediaObj?.url}
                  websiteUrl={websiteUrl}
                />
              )}

              {activeTab === 'instagram' && (
                <InstagramPreview
                  accountName={companyName ? companyName.toLowerCase().replace(/\s+/g, '.') : 'socialpilot.ai'}
                  caption={platformPosts.instagram?.caption || ''}
                  mediaUrl={selectedMediaObj?.url}
                />
              )}

              {activeTab === 'linkedin' && (
                <LinkedInPreview
                  authorName={companyName || 'Leadership Team'}
                  tagline={companyDescription || 'Innovating Social Workflows'}
                  caption={platformPosts.linkedin?.caption || ''}
                  mediaUrl={selectedMediaObj?.url}
                  websiteUrl={websiteUrl}
                />
              )}

              {activeTab === 'twitter' && (
                <TwitterPreview
                  displayName={companyName || 'SocialPilot AI'}
                  accountHandle={companyName ? `@${companyName.replace(/\s+/g, '')}` : '@socialpilot_ai'}
                  caption={platformPosts.twitter?.caption || ''}
                  mediaUrl={selectedMediaObj?.url}
                />
              )}

              {activeTab === 'threads' && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      @
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{companyName || 'InfiniteTech AI'}</div>
                      <div className="text-[10px] text-slate-400">@infinitetechai • 2h</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {platformPosts.threads?.caption || platformPosts.facebook?.caption || 'Sample Threads post copy...'}
                  </p>
                  {selectedMediaObj && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-80">
                      <img src={selectedMediaObj.url} alt="Attached Media" className="w-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'youtube' && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                      ▶
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{companyName || 'InfiniteTech AI'}</div>
                      <div className="text-[10px] text-slate-400">Community Post • 10.4K subscribers</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {platformPosts.youtube?.caption || platformPosts.facebook?.caption || 'Sample YouTube community post...'}
                  </p>
                  {selectedMediaObj && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-80">
                      <img src={selectedMediaObj.url} alt="Attached Media" className="w-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pinterest' && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-700 text-white flex items-center justify-center font-bold text-xs">
                      P
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{companyName || 'InfiniteTech AI'}</div>
                      <div className="text-[10px] text-slate-400">Saved to: Modern Business Automation</div>
                    </div>
                  </div>
                  {selectedMediaObj && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-96">
                      <img src={selectedMediaObj.url} alt="Attached Media" className="w-full object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {platformPosts.pinterest?.caption || platformPosts.facebook?.caption || 'Sample Pinterest pin description...'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Publishing & Auto-Posting Action Card */}
          {packageData && (
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/30 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Clock className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Ready to Auto-Publish?</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Autonomous Worker Active
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Choose between immediate publication or hands-free scheduled auto-publishing.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<Clock className="w-4 h-4 text-indigo-400" />}
                    onClick={() => setShowScheduleModal(true)}
                  >
                    ⚡ Schedule Auto-Post
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Send className="w-4 h-4" />}
                    onClick={() => setShowPublishModal(true)}
                  >
                    Publish Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation, Scheduling & Image Studio Modals */}
      <PublishConfirmModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={triggerPublishNow}
        platformPosts={Object.entries(platformPosts).map(([pName, pData]) => ({
          platform: pName,
          caption: pData.caption,
          mediaUrl: selectedMediaObj?.url,
        }))}
      />

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={triggerSchedule}
      />

      {isEditorOpen && (
        <ImageEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          initialMedia={selectedMediaObj}
          onMediaSaved={(saved) => {
            setAvailableMedia(prev => [saved, ...prev]);
            setSelectedMediaId(saved.id);
            setIsEditorOpen(false);
            toast.success('Custom flyer saved to post!');
          }}
        />
      )}
    </div>
  );
};
