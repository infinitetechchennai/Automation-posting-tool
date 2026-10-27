import React, { useState } from 'react';
import {
  Sparkles,
  Hash,
  Wand2,
  FileText,
  Repeat,
  Copy,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Tags,
  ShieldCheck,
  Send
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const AIContentStudioPage: React.FC = () => {
  const toast = useToast();
  const [activeTool, setActiveTool] = useState<'hashtags' | 'improver' | 'repurpose'>('improver');

  // Hashtag Generator State
  const [hashtagTopic, setHashtagTopic] = useState('');
  const [hashtagIndustry, setHashtagIndustry] = useState('Technology');
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);

  // Caption Improver State
  const [captionInput, setCaptionInput] = useState('');
  const [improveAction, setImproveAction] = useState('improve');
  const [targetTone, setTargetTone] = useState('Professional');
  const [improvedCaption, setImprovedCaption] = useState('');
  const [loadingImprove, setLoadingImprove] = useState(false);

  // Content Repurposer State
  const [sourceText, setSourceText] = useState('');
  const [sourceType, setSourceType] = useState<'raw_text' | 'blog_url' | 'article'>('raw_text');
  const [repurposedPackage, setRepurposedPackage] = useState<any>(null);
  const [loadingRepurpose, setLoadingRepurpose] = useState(false);

  const handleGenerateHashtags = async () => {
    if (!hashtagTopic.trim()) {
      toast.error('Topic required', 'Please enter a topic for hashtag generation.');
      return;
    }
    setLoadingHashtags(true);
    try {
      const res = await api.generateHashtags(hashtagTopic, hashtagIndustry, 20);
      setGeneratedHashtags(res.hashtags);
      toast.success('Hashtags Generated!', `${res.hashtags.length} relevant tags produced.`);
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setLoadingHashtags(false);
    }
  };

  const handleImproveCaption = async () => {
    if (!captionInput.trim()) {
      toast.error('Caption required', 'Please enter caption text to improve.');
      return;
    }
    setLoadingImprove(true);
    try {
      const res = await api.improveCaption(captionInput, improveAction, targetTone);
      setImprovedCaption(res.improved);
      toast.success('Caption Processed!', `Applied action: ${improveAction}.`);
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setLoadingImprove(false);
    }
  };

  const handleRepurposeContent = async () => {
    if (!sourceText.trim()) {
      toast.error('Source content required', 'Please enter an article, blog URL, or raw text.');
      return;
    }
    setLoadingRepurpose(true);
    try {
      const res = await api.repurposeContent(sourceText, sourceType, ['facebook', 'instagram', 'linkedin', 'twitter']);
      setRepurposedPackage(res);
      toast.success('Content Repurposed!', 'Generated cross-platform social package.');
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setLoadingRepurpose(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Copied!', `${label} copied to clipboard.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          AI Content Studio & Growth Toolset
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Dedicated AI micro-tools for hashtag generation, caption refinement, grammar checking, tone adaptation, and blog repurposing.
        </p>
      </div>

      {/* Tool Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTool('improver')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTool === 'improver'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>Caption Improver & Grammar</span>
        </button>
        <button
          onClick={() => setActiveTool('hashtags')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTool === 'hashtags'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Hashtag Generator</span>
        </button>
        <button
          onClick={() => setActiveTool('repurpose')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTool === 'repurpose'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Blog & Content Repurposer</span>
        </button>
      </div>

      {/* TOOL 1: Caption Improver */}
      {activeTool === 'improver' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Input Draft Caption
            </h2>
            <textarea
              rows={8}
              value={captionInput}
              onChange={e => setCaptionInput(e.target.value)}
              placeholder="Paste or write your raw caption here..."
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Action
                </label>
                <select
                  value={improveAction}
                  onChange={e => setImproveAction(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="improve">Enhance Clarity & Hook</option>
                  <option value="shorten">Shorten & Condense</option>
                  <option value="expand">Expand & Add Value</option>
                  <option value="check_grammar">Fix Grammar & Formatting</option>
                  <option value="change_tone">Shift Tone</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Tone
                </label>
                <select
                  value={targetTone}
                  onChange={e => setTargetTone(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Professional">Professional</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Inspirational">Inspirational</option>
                  <option value="Technical">Technical</option>
                  <option value="Promotional">Promotional</option>
                </select>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              icon={<Wand2 className="w-4 h-4" />}
              onClick={handleImproveCaption}
              loading={loadingImprove}
            >
              Transform Caption
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Transformed Output
              </h2>
              {improvedCaption && (
                <button
                  onClick={() => copyToClipboard(improvedCaption, 'Transformed caption')}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 min-h-[220px] text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {improvedCaption || (
                <span className="text-slate-400 italic">
                  Run the transformer to view improved output here...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOOL 2: Hashtag Generator */}
      {activeTool === 'hashtags' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Generate Targeted Hashtags
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Post Topic or Niche
              </label>
              <input
                type="text"
                placeholder="e.g. AI SaaS Product Launch"
                value={hashtagTopic}
                onChange={e => setHashtagTopic(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={hashtagIndustry}
                onChange={e => setHashtagIndustry(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <Button
            variant="primary"
            icon={<Hash className="w-4 h-4" />}
            onClick={handleGenerateHashtags}
            loading={loadingHashtags}
          >
            Generate Hashtags
          </Button>

          {generatedHashtags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Generated Tags ({generatedHashtags.length})
                </span>
                <button
                  onClick={() => copyToClipboard(generatedHashtags.join(' '), 'All hashtags')}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {generatedHashtags.map(tag => (
                  <span
                    key={tag}
                    onClick={() => copyToClipboard(tag, tag)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs font-medium cursor-pointer hover:bg-indigo-100 transition"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: Blog to Social Repurposer */}
      {activeTool === 'repurpose' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Convert Long-Form Content to Multi-Platform Social Posts
          </h2>
          <textarea
            rows={6}
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            placeholder="Paste blog post article, summary, or enter URL..."
            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <Button
            variant="primary"
            icon={<Repeat className="w-4 h-4" />}
            onClick={handleRepurposeContent}
            loading={loadingRepurpose}
          >
            Repurpose Into Cross-Platform Package
          </Button>

          {repurposedPackage && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(repurposedPackage.platform_posts || {}).map(([pName, pData]: any) => (
                <div key={pName} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={pName as any} size="sm">{pName.toUpperCase()}</Badge>
                    <button
                      onClick={() => copyToClipboard(pData.caption, `${pName} caption`)}
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {pData.caption}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
