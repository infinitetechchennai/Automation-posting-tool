import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Sparkles,
  Calendar,
  Trash2,
  Edit,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { api, Campaign } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

const CAMPAIGN_TEMPLATES = [
  { name: 'Product Launch Surge', objective: 'Announce a launch', tone: 'Inspirational', type: 'Product launch' },
  { name: 'Service Value Explainer', objective: 'Generate leads', tone: 'Professional', type: 'Service promotion' },
  { name: 'Educational Insight Series', objective: 'Educate the audience', tone: 'Educational', type: 'Educational series' },
  { name: 'Thought Leadership Drive', objective: 'Increase brand awareness', tone: 'Professional', type: 'Industry insight' },
  { name: 'Seasonal Promo Blitz', objective: 'Promote a product', tone: 'Promotional', type: 'Seasonal content' },
  { name: 'Hiring & Culture Campaign', objective: 'Recruit employees', tone: 'Friendly', type: 'Recruitment' },
];

export const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Campaign Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('Brand Awareness');
  const [targetAudience, setTargetAudience] = useState('');
  const [creating, setCreating] = useState(false);

  // Proposal Batch Modal
  const [proposedBatch, setProposedBatch] = useState<any[] | null>(null);
  const [batchNotice, setBatchNotice] = useState('');
  const [generatingBatch, setGeneratingBatch] = useState(false);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await api.listCampaigns();
      setCampaigns(data);
    } catch (err: any) {
      toast.error('Failed to load campaigns', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Campaign name required');
      return;
    }
    setCreating(true);
    try {
      const created = await api.createCampaign({
        name,
        objective,
        target_audience: targetAudience,
      });
      toast.success('Campaign Created!', `${created.name} is now ready for structured post generation.`);
      setIsModalOpen(false);
      setName('');
      setTargetAudience('');
      loadCampaigns();
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleApplyTemplate = (tmpl: any) => {
    setName(`${tmpl.name} — ${new Date().toLocaleString('default', { month: 'short' })}`);
    setObjective(tmpl.objective);
    setIsModalOpen(true);
  };

  const handleGenerateBatch = async (campId: number) => {
    setGeneratingBatch(true);
    try {
      const res = await api.generateCampaignBatch(campId, 3);
      setProposedBatch(res.proposed_posts);
      setBatchNotice(res.notice);
      toast.success('Batch Proposed!', 'Review proposed posts below. Approval required to publish.');
    } catch (err: any) {
      toast.error('Batch Generation Failed', err.message);
    } finally {
      setGeneratingBatch(false);
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.deleteCampaign(id);
      toast.info('Campaign Deleted');
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      toast.error('Delete Failed', err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            Campaign Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize content into strategic marketing initiatives, generate multi-post proposals, and govern approval workflows.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Campaign
        </Button>
      </div>

      {/* Campaign Templates Section Mandated by Section 16 */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Reusable Campaign Templates
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {CAMPAIGN_TEMPLATES.map(tmpl => (
            <div
              key={tmpl.name}
              onClick={() => handleApplyTemplate(tmpl)}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 cursor-pointer transition shadow-sm group"
            >
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition">
                {tmpl.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {tmpl.objective}
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-600 font-semibold">
                <span>Use Template</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Campaigns List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Active Campaigns ({campaigns.length})
        </h2>

        {campaigns.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No campaigns active yet. Pick a template above or click Create Campaign!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map(camp => (
              <div
                key={camp.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 hover:shadow transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {camp.name}
                    </h3>
                    <Badge variant="info" size="sm" className="mt-1">
                      {camp.objective}
                    </Badge>
                  </div>
                  <button
                    onClick={() => handleDeleteCampaign(camp.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Delete campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>Audience:</strong> {camp.target_audience || 'All Audience'}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    {camp.posts_count} posts created
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                    onClick={() => handleGenerateBatch(camp.id)}
                    loading={generatingBatch}
                  >
                    Generate Batch (3)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proposed Batch Section Mandated by Section 16 */}
      {proposedBatch && (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Proposed Campaign Post Batch (Awaiting User Approval)
              </h2>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                {batchNotice}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setProposedBatch(null)}>
              Dismiss
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proposedBatch.map((p, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Option {p.proposal_index}: {p.theme}
                  </span>
                  <Badge variant="warning" size="sm">Review Required</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-4">
                  {p.content_package.main_caption}
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full mt-2"
                  onClick={() => {
                    navigate('/create-post');
                    toast.info('Transferred to Studio', 'Review caption, adjust platforms, and schedule!');
                  }}
                >
                  Approve & Edit
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Marketing Campaign"
        description="Define campaign parameters for AI content generation."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Campaign Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 SaaS Product Launch"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Strategic Objective
            </label>
            <input
              type="text"
              value={objective}
              onChange={e => setObjective(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Audience
            </label>
            <input
              type="text"
              placeholder="e.g. Agency owners, enterprise leads"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating}>Create Campaign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
