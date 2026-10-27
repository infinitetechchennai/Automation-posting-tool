import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Sparkles, ArrowRight, Copy } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

const TEMPLATES = [
  {
    id: 'launch-surge',
    title: 'Product Feature Launch Surge',
    category: 'Product Announcement',
    tone: 'Inspirational',
    objective: 'Announce a launch',
    description: 'Structure: Hook highlighting friction -> Solution announcement -> 3 core benefits -> Call to action with free trial offer.',
    sampleCopy: 'Stop spending hours on manual clerical tasks. Introducing our new automated engine designed to save you 15+ hours weekly.',
  },
  {
    id: 'case-study',
    title: 'Customer Transformation & Proof',
    category: 'Industry Insight',
    tone: 'Professional',
    objective: 'Generate leads',
    description: 'Structure: The before status -> The exact bottleneck -> The solution applied -> The tangible quantitative result.',
    sampleCopy: 'How one team reduced content production cycles from 3 days to 45 minutes using automated multi-platform workflows.',
  },
  {
    id: 'step-by-step',
    title: 'Educational Step-by-Step Carousel',
    category: 'Educational post',
    tone: 'Educational',
    objective: 'Educate the audience',
    description: 'Structure: Numbered breakdown of 4 actionable tactics your audience can implement today without paid software.',
    sampleCopy: '4 practical frameworks for scaling your social footprint with ₹0 budget using open-source tools.',
  },
  {
    id: 'founder-insight',
    title: 'Behind-the-Scenes Founder Story',
    category: 'Company announcement',
    tone: 'Conversational',
    objective: 'Increase brand awareness',
    description: 'Structure: Vulnerable story on what went wrong -> The counterintuitive breakthrough -> The core lesson learned.',
    sampleCopy: 'When we first started building, we thought more tools meant more growth. We were completely wrong. Here is what actually worked:',
  },
  {
    id: 'quick-faq',
    title: 'Common Question & Myth Buster',
    category: 'FAQ',
    tone: 'Technical',
    objective: 'Educate the audience',
    description: 'Structure: Top myth in your industry -> Why it persists -> The factual reality -> Best practice recommendation.',
    sampleCopy: 'Myth: You need expensive paid APIs to automate your social distribution. Reality: Local models and open APIs can run completely free.',
  },
  {
    id: 'flash-offer',
    title: 'Limited-Time Promotional Blitz',
    category: 'Promotional post',
    tone: 'Promotional',
    objective: 'Promote a product',
    description: 'Structure: Urgent hook -> Exclusive incentive -> Risk-free guarantee -> Direct action link.',
    sampleCopy: 'Unlock all enterprise features free for the next 14 days. Zero credit card needed. Start automating in minutes.',
  },
];

export const ContentTemplatesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-indigo-600" />
          Content Strategy & Social Templates
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Proven social copywriting frameworks engineered for high engagement across Facebook, Instagram, LinkedIn, and X.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TEMPLATES.map(tmpl => (
          <div
            key={tmpl.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Badge variant="info" size="sm">{tmpl.category}</Badge>
                <span className="text-[11px] font-mono text-slate-400 capitalize">{tmpl.tone}</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {tmpl.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {tmpl.description}
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs italic text-slate-600 dark:text-slate-300">
                "{tmpl.sampleCopy}"
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              icon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
              onClick={() => {
                navigate('/create-post');
              }}
            >
              Use in AI Studio
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
