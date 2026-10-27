import React, { useState, useEffect } from 'react';
import { Building2, Save, Sparkles, ShieldAlert, Palette, CheckCircle2 } from 'lucide-react';
import { api, BrandSettings } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';

export const BrandSettingsPage: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColors, setBrandColors] = useState<string[]>(['#4F46E5', '#06B6D4']);
  const [industry, setIndustry] = useState('Technology');
  const [targetAudience, setTargetAudience] = useState('');
  const [writingTone, setWritingTone] = useState('Professional');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [defaultCta, setDefaultCta] = useState('');
  const [defaultHashtags, setDefaultHashtags] = useState('');
  const [prohibitedPhrases, setProhibitedPhrases] = useState('');
  const [brandGuidelines, setBrandGuidelines] = useState('');

  useEffect(() => {
    api.getBrandSettings()
      .then(b => {
        if (b) {
          setCompanyName(b.company_name || '');
          setWebsite(b.website || '');
          setCompanyDescription(b.company_description || '');
          setLogoUrl(b.logo_url || '');
          if (b.brand_colors && b.brand_colors.length > 0) setBrandColors(b.brand_colors);
          setIndustry(b.industry || 'Technology');
          setTargetAudience(b.target_audience || '');
          setWritingTone(b.writing_tone || 'Professional');
          setPreferredLanguage(b.preferred_language || 'English');
          setDefaultCta(b.default_cta || '');
          setDefaultHashtags(b.default_hashtags || '');
          setProhibitedPhrases(b.prohibited_phrases || '');
          setBrandGuidelines(b.brand_guidelines || '');
        }
      })
      .catch(err => {
        console.error('Failed to load brand settings:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateBrandSettings({
        company_name: companyName,
        website,
        company_description: companyDescription,
        logo_url: logoUrl,
        brand_colors: brandColors,
        industry,
        target_audience: targetAudience,
        writing_tone: writingTone,
        preferred_language: preferredLanguage,
        default_cta: defaultCta,
        default_hashtags: defaultHashtags,
        prohibited_phrases: prohibitedPhrases,
        brand_guidelines: brandGuidelines,
      });
      toast.success('Brand Identity Saved!', 'These settings will automatically guide your future AI generations.');
    } catch (err: any) {
      toast.error('Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddColor = () => {
    setBrandColors(prev => [...prev, '#6366F1']);
  };

  const handleUpdateColor = (idx: number, val: string) => {
    const updated = [...brandColors];
    updated[idx] = val;
    setBrandColors(updated);
  };

  const handleRemoveColor = (idx: number) => {
    setBrandColors(brandColors.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" />
          Brand Identity & Voice Guidelines
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Define brand voice, colors, prohibited phrases, and default CTAs. Updating settings will never alter already scheduled content.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            Company Core Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Website
              </label>
              <input
                type="text"
                placeholder="https://example.com"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Description & Value Proposition
            </label>
            <textarea
              rows={3}
              value={companyDescription}
              onChange={e => setCompanyDescription(e.target.value)}
              placeholder="Explain what your company does and who you serve..."
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Brand Palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Brand Colors (Hex)
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {brandColors.map((color, idx) => (
                <div key={idx} className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <input
                    type="color"
                    value={color}
                    onChange={e => handleUpdateColor(idx, e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={e => handleUpdateColor(idx, e.target.value)}
                    className="w-20 text-[11px] font-mono bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                  {brandColors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(idx)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={handleAddColor}>
                + Add Color
              </Button>
            </div>
          </div>
        </div>

        {/* AI Voice & Tone Governance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            AI Voice & Tone Governance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Writing Tone
              </label>
              <select
                value={writingTone}
                onChange={e => setWritingTone(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Professional">Professional</option>
                <option value="Conversational">Conversational</option>
                <option value="Inspirational">Inspirational</option>
                <option value="Educational">Educational</option>
                <option value="Technical">Technical</option>
                <option value="Promotional">Promotional</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Language
              </label>
              <input
                type="text"
                value={preferredLanguage}
                onChange={e => setPreferredLanguage(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Call to Action (CTA)
              </label>
              <input
                type="text"
                placeholder="e.g. Visit our website to learn more"
                value={defaultCta}
                onChange={e => setDefaultCta(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Hashtags (e.g. #Brand #Innovation)
              </label>
              <input
                type="text"
                value={defaultHashtags}
                onChange={e => setDefaultHashtags(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
              Prohibited Words & Phrases (Strict AI Filter)
            </label>
            <input
              type="text"
              placeholder="e.g. cheap, guaranteed riches, 100% risk free"
              value={prohibitedPhrases}
              onChange={e => setProhibitedPhrases(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Brand Guidelines
            </label>
            <textarea
              rows={3}
              value={brandGuidelines}
              onChange={e => setBrandGuidelines(e.target.value)}
              placeholder="Any specific style rules (e.g. Avoid hype; always mention reliability and open source)."
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={<Save className="w-4 h-4" />}
            loading={saving}
          >
            Save Brand Guidelines
          </Button>
        </div>
      </form>
    </div>
  );
};
