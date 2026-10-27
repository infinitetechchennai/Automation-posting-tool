import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  Layers,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Send,
  Zap,
  Upload,
  Image as ImageIcon,
  Edit3,
  Flame,
  Check,
  FileSpreadsheet,
  Download,
  Table,
  FileText,
  X,
  UploadCloud,
  RefreshCw,
  Copy
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api, Post, MediaItem } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export interface ImportedTopicRow {
  topic: string;
  heading?: string;
  details?: string[];
  keywords?: string;
  call_to_action?: string;
  website?: string;
  target_audience?: string;
  platforms?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  status?: 'Valid' | 'Needs Attention' | 'Invalid';
}

const SAMPLE_INFINITETECH_TOPICS = [
  "From Chaos to Control: Work Less, Achieve More with InfiniteTech AI",
  "Automated Invoicing: Create, Send & Track Invoices on Autopilot",
  "Intelligent Scheduling: No More Clashes, Perfectly Planned Meetings",
  "Data Entry on Autopilot: Extract, Enter, Organize, Done",
  "Instant Follow-ups & Growth Insights: Save up to 70% of Admin Time"
];

const TEN_AI_TRENDING_TOPICS = [
  "The 2026 AI Playbook: How Modern Companies Scale Without Adding Headcount",
  "Autonomous AI Workflows vs Manual Chaos: The 70% Time Savings Secret",
  "Zero-Touch Invoicing: How Intelligent Automation Ends Late Client Payments",
  "Intelligent Smart Calendars: Say Goodbye to Meeting Clashes & Rescheduling",
  "Automated Data Entry: Turning Raw PDFs & Scans into Structured Records in Seconds",
  "Context-Aware Customer Support: How 24/7 AI Copilots Transform Retention",
  "The Rise of Agentic AI: Why Static Software is Being Replaced in 2026",
  "Lead Qualification on Autopilot: Instant CRM Updates & Smart Outreach",
  "Cutting Operational Bloat: How Small Teams Outcompete Fortune 500 Giants",
  "From Admin Burnout to High Growth: Unlocking 10x Business Productivity"
];

export const BulkAutoPostPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Topics input
  const [topicsText, setTopicsText] = useState(TEN_AI_TRENDING_TOPICS.join('\n'));
  const [inputMode, setInputMode] = useState<'text' | 'excel'>('text');
  const [importedRows, setImportedRows] = useState<ImportedTopicRow[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const [parsingExcel, setParsingExcel] = useState(false);

  // Bulk Generation Live Progress Tracker
  const [progressState, setProgressState] = useState<{
    isOpen: boolean;
    current: number;
    total: number;
    isPaused: boolean;
    isFinished: boolean;
    currentTitle: string;
    templateName: string;
  }>({
    isOpen: false,
    current: 0,
    total: 0,
    isPaused: false,
    isFinished: false,
    currentTitle: '',
    templateName: '',
  });
  const cancelRequestedRef = useRef(false);
  const pauseRequestedRef = useRef(false);

  // Company and campaign details
  const [companyName, setCompanyName] = useState('InfiniteTech AI');
  const [websiteUrl, setWebsiteUrl] = useState('https://www.infinitetechai.com');
  const [callToAction, setCallToAction] = useState('Visit www.infinitetechai.com or call +91-9884777171 to automate your business!');
  const [tone, setTone] = useState('Professional');
  const [targetAudience, setTargetAudience] = useState('Business Owners, Entrepreneurs & Operations Teams');

  // Scheduling Cadence
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultStartDate = tomorrow.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [startTime, setStartTime] = useState('10:00');
  const [intervalHours, setIntervalHours] = useState(24); // Daily
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Image Generation & Media Strategy
  const [imageMode, setImageMode] = useState<'ai_generate' | 'shared_flyer' | 'none'>('ai_generate');
  const [availableMedia, setAvailableMedia] = useState<MediaItem[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const flyerFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFlyer, setUploadingFlyer] = useState(false);

  const handleUploadFlyer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFlyer(true);
    try {
      const uploaded = await api.uploadMedia(file, file.name);
      setAvailableMedia(prev => [uploaded, ...prev]);
      setSelectedMediaId(uploaded.id);
      setImageMode('shared_flyer');
      toast.success('Flyer Image Uploaded!', `Selected ${uploaded.original_filename} for bulk auto-posting.`);
    } catch (err: any) {
      toast.error('Upload Failed', err.message || 'Could not upload image');
    } finally {
      setUploadingFlyer(false);
      if (flyerFileInputRef.current) flyerFileInputRef.current.value = '';
    }
  };

  // Target Platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'facebook',
    'instagram',
    'linkedin',
    'twitter',
  ]);

  // Loading & Results
  const [generating, setGenerating] = useState(false);
  const [scheduledResult, setScheduledResult] = useState<Post[] | null>(null);

  useEffect(() => {
    loadMediaLibrary();
  }, []);

  const loadMediaLibrary = async () => {
    try {
      const mediaList = await api.listMedia();
      setAvailableMedia(mediaList);
      // Auto-select the InfiniteTech flyer if available
      const flyer = mediaList.find(m => m.storage_key.includes('infinitetech') || m.original_filename.includes('InfiniteTech'));
      if (flyer) {
        setSelectedMediaId(flyer.id);
      } else if (mediaList.length > 0) {
        setSelectedMediaId(mediaList[0].id);
      }
    } catch {
      // ignore
    }
  };

  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        "title": "Automated Invoicing: Create, Send & Track Invoices on Autopilot",
        "details": "100% Automated Invoicing with Zero Data Entry Errors; Instant WhatsApp & Email Reminders for Faster Client Payments",
        "keywords": "AI Invoicing, Automation, FinTech, Productivity",
        "cta": "Book a Demo",
        "website": "www.infinitetechai.com",
        "target_audience": "Finance Managers & Business Owners",
        "platforms": "facebook, instagram, linkedin, twitter",
        "scheduled_date": "2026-10-28",
        "scheduled_time": "10:00"
      },
      {
        "title": "Intelligent Scheduling: No More Clashes, Perfectly Planned Meetings",
        "details": "Seamless 24/7 Smart Calendar Sync Across All Platforms; Zero Double Bookings & Autonomous AI Follow-Up Reminders",
        "keywords": "Scheduling AI, Calendar Automation, Operations",
        "cta": "Get Started",
        "website": "www.infinitetechai.com",
        "target_audience": "Operations Directors & Executives",
        "platforms": "facebook, linkedin, twitter",
        "scheduled_date": "2026-10-29",
        "scheduled_time": "14:30"
      },
      {
        "title": "From Chaos to Control: Work Less, Achieve More with InfiniteTech AI",
        "details": "Turn Everyday Operational Delays into Seamless Auto-Pilot; Unified AI Agents for Marketing, Invoicing, and Customer Care",
        "keywords": "AI Platform, Digital Transformation, Workflow",
        "cta": "Learn More",
        "website": "www.infinitetechai.com",
        "target_audience": "SME Founders & Growth Teams",
        "platforms": "facebook, instagram, linkedin, twitter, threads",
        "scheduled_date": "2026-10-30",
        "scheduled_time": "09:00"
      },
      {
        "title": "AI Calling Agent for Business",
        "details": "Automate customer calls, reminders, follow-ups and collections using AI voice agents with zero missed opportunities",
        "keywords": "AI Voice, Inbound Calls, Customer Service",
        "cta": "Book a Demo",
        "website": "www.infinitetechai.com",
        "target_audience": "Customer Success & Sales Heads",
        "platforms": "facebook, instagram, linkedin, twitter, youtube",
        "scheduled_date": "2026-10-31",
        "scheduled_time": "11:15"
      },
      {
        "title": "Data Entry on Autopilot: Extract, Enter, Organize, Done",
        "details": "Extract data from raw PDFs & Scans in seconds; Automatic CRM & ERP Sync with zero human touch",
        "keywords": "OCR, Autonomous Data, Back-Office",
        "cta": "Request a Quote",
        "website": "www.infinitetechai.com",
        "target_audience": "Operations Teams",
        "platforms": "linkedin, twitter",
        "scheduled_date": "2026-11-01",
        "scheduled_time": "16:00"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 38 }, { wch: 55 }, { wch: 30 }, { wch: 18 },
      { wch: 25 }, { wch: 30 }, { wch: 35 }, { wch: 15 }, { wch: 15 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample_Posts");
    XLSX.writeFile(wb, "Sample_Social_Posts_Template.xlsx");
    toast.success('Downloaded Sample Excel Template!', 'Fill in your post details, then upload it back.');
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingExcel(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          toast.error('Empty Spreadsheet', 'No data rows found in the uploaded file.');
          return;
        }

        const parsedItems: ImportedTopicRow[] = [];
        jsonRows.forEach((row: any) => {
          const keys = Object.keys(row);
          const titleKey = keys.find(k => /^(title|topic|post_title|post\s*title|name)$/i.test(k.trim())) || keys.find(k => /topic|title/i.test(k)) || keys[0];
          const titleVal = String(row[titleKey] || '').trim();

          const headingKey = keys.find(k => /heading|hook|subheading|subtitle/i.test(k));
          const headingVal = headingKey ? String(row[headingKey] || '').trim() : undefined;

          const detailsKey = keys.find(k => /detail|content|bullet|benefit|description|body/i.test(k));
          let detailsVal: string[] | undefined = undefined;
          if (detailsKey && row[detailsKey]) {
            detailsVal = String(row[detailsKey]).split(/;|\n|•/).map(d => d.trim()).filter(Boolean);
          }

          const kwKey = keys.find(k => /keyword/i.test(k));
          const kwVal = kwKey ? String(row[kwKey] || '').trim() : undefined;

          const ctaKey = keys.find(k => /cta|call_to_action|call\s*to\s*action|button|action/i.test(k));
          const ctaVal = ctaKey ? String(row[ctaKey] || '').trim() : undefined;

          const webKey = keys.find(k => /website|url/i.test(k));
          const webVal = webKey ? String(row[webKey] || '').trim() : undefined;

          const audKey = keys.find(k => /audience|target/i.test(k));
          const audVal = audKey ? String(row[audKey] || '').trim() : undefined;

          const platKey = keys.find(k => /platform/i.test(k));
          const platVal = platKey ? String(row[platKey] || '').trim() : undefined;

          const dateKey = keys.find(k => /date/i.test(k));
          const dateVal = dateKey ? String(row[dateKey] || '').trim() : undefined;

          const timeKey = keys.find(k => /time/i.test(k));
          const timeVal = timeKey ? String(row[timeKey] || '').trim() : undefined;

          const status: 'Valid' | 'Needs Attention' = titleVal ? 'Valid' : 'Needs Attention';

          parsedItems.push({
            topic: titleVal || '(Untitled Post - Click to edit)',
            heading: headingVal,
            details: detailsVal,
            keywords: kwVal,
            call_to_action: ctaVal,
            website: webVal,
            target_audience: audVal,
            platforms: platVal,
            scheduled_date: dateVal,
            scheduled_time: timeVal,
            status
          });
        });

        if (parsedItems.length === 0) {
          toast.error('No Titles Detected', 'Could not find any title or topic rows in the spreadsheet.');
          return;
        }

        setImportedRows(parsedItems);
        setExcelFileName(file.name);
        setTopicsText(parsedItems.map(p => p.topic).join('\n'));
        setInputMode('excel');
        toast.success(
          `Imported ${parsedItems.length} Post Rows!`,
          `Loaded from "${file.name}". All rows validated.`
        );
      } catch (err: any) {
        toast.error('Failed to parse spreadsheet', err.message || 'Please upload a valid .xlsx or .csv file.');
      } finally {
        setParsingExcel(false);
        if (excelFileInputRef.current) excelFileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Row Manipulation Handlers (Section 5 Option A & B)
  const handleAddRow = () => {
    const newIdx = importedRows.length + 1;
    const newRow: ImportedTopicRow = {
      topic: `AI Growth Workflow #${newIdx}`,
      heading: 'Transform Operations with Autonomous AI',
      details: ['Automate repetitive workflows', 'Save 70% admin time', 'Scale effortlessly'],
      call_to_action: 'Book a Demo',
      status: 'Valid'
    };
    setImportedRows(prev => [...prev, newRow]);
    setInputMode('excel');
    toast.success('Row Added', 'Added a new post row. Click any field to customize.');
  };

  const handleDeleteRow = (idx: number) => {
    setImportedRows(prev => prev.filter((_, i) => i !== idx));
    toast.info('Row Removed');
  };

  const handleDuplicateRow = (idx: number) => {
    const target = importedRows[idx];
    if (!target) return;
    setImportedRows(prev => [
      ...prev.slice(0, idx + 1),
      { ...target, topic: `${target.topic} (Copy)` },
      ...prev.slice(idx + 1)
    ]);
    toast.success('Row Duplicated');
  };

  const handleUpdateRowField = (idx: number, field: keyof ImportedTopicRow, val: any) => {
    setImportedRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      if (field === 'topic') {
        copy[idx].status = String(val).trim() ? 'Valid' : 'Needs Attention';
      }
      return copy;
    });
  };

  const handleExportExcel = () => {
    const exportData = (importedRows.length > 0 ? importedRows : parsedTopics.map(t => ({ topic: t, details: [] as string[], keywords: '', call_to_action: '', website: '', target_audience: '', platforms: '', scheduled_date: '', scheduled_time: '' }))).map((r: any) => ({
      title: r.topic,
      details: r.details ? r.details.join('; ') : '',
      keywords: r.keywords || 'AI, Automation, Enterprise',
      cta: r.call_to_action || callToAction,
      website: r.website || websiteUrl,
      target_audience: r.target_audience || targetAudience,
      platforms: r.platforms || selectedPlatforms.join(', '),
      scheduled_date: r.scheduled_date || startDate,
      scheduled_time: r.scheduled_time || startTime,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Posts_Export");
    XLSX.writeFile(wb, "AI_Social_Posts_Export.xlsx");
    toast.success('Exported to Excel!', 'Downloaded AI_Social_Posts_Export.xlsx');
  };

  const handleClearExcel = () => {
    setImportedRows([]);
    setExcelFileName('');
    setInputMode('text');
    toast.info('Cleared Excel Import', 'Switched back to text mode.');
  };

  const handleLoadDemoExcel = () => {
    const demoItems: ImportedTopicRow[] = [
      {
        topic: "AI Voice & Calling Receptionist",
        heading: "AI Receptionist: Never Miss a High-Value Lead",
        details: [
          "24/7 Automated Inbound Call Handling",
          "Instant Appointment Booking into Google Calendar",
          "Human Hand-off for Complex VIP Inquiries"
        ],
        call_to_action: "Book a 15-min Live Voice Demo at www.infinitetechai.com"
      },
      {
        topic: "Zero-Touch Invoicing & Expense Recon",
        heading: "Zero-Touch Invoicing: How Intelligent AI Ends Late Client Payments",
        details: [
          "Reads PDFs and receipts with 99.8% OCR accuracy",
          "Auto-matches line items against bank statements",
          "Automated polite WhatsApp & Email payment reminders"
        ],
        call_to_action: "Start Free Invoicing Pilot at www.infinitetechai.com"
      },
      {
        topic: "Smart Calendar & Automated Rescheduling",
        heading: "Intelligent Smart Calendars: Say Goodbye to Meeting Clashes",
        details: [
          "AI predicts scheduling conflicts across timezones",
          "One-click automated rescheduling via WhatsApp",
          "Syncs two-way with Zoom & Google Meet"
        ],
        call_to_action: "Automate your calendar at www.infinitetechai.com"
      },
      {
        topic: "AI-Powered WhatsApp & Email Follow-Ups",
        heading: "Context-Aware Follow-Ups: Turn Cold Prospects into Paid Clients",
        details: [
          "Personalized conversational drip sequences based on past emails",
          "Detects customer intent & auto-responds in 30 seconds",
          "Multi-channel sync across WhatsApp and Gmail"
        ],
        call_to_action: "Try Instant AI Outreach at www.infinitetechai.com"
      },
      {
        topic: "From Chaos to Control: Operations Hub",
        heading: "From Admin Burnout to High Growth: Unlocking 10x Team Productivity",
        details: [
          "Eliminate 15+ hours of weekly repetitive paperwork",
          "Unified dashboard for all tasks and team communications",
          "70% reduction in customer response delays"
        ],
        call_to_action: "Schedule Your Automation Audit at www.infinitetechai.com"
      }
    ];
    setImportedRows(demoItems);
    setExcelFileName('InfiniteTech_Bulk_Topics_Template.xlsx');
    setTopicsText(demoItems.map(d => d.topic).join('\n'));
    setInputMode('excel');
    toast.success('Loaded Demo Excel Data', 'Populated 5 structured topics with custom headings, bullet details, and CTAs.');
  };

  const load10AITopics = () => {
    setTopicsText(TEN_AI_TRENDING_TOPICS.join('\n'));
    setCompanyName('InfiniteTech AI');
    setWebsiteUrl('https://www.infinitetechai.com');
    setCallToAction('Visit www.infinitetechai.com or call +91-9884777171 to automate your business!');
    setImageMode('ai_generate');
    setInputMode('text');
    toast.success('Loaded 10 AI Trending Topics', '10 high-impact AI titles loaded with auto-generated graphics enabled!');
  };

  const loadSampleTopics = () => {
    setTopicsText(SAMPLE_INFINITETECH_TOPICS.join('\n'));
    setCompanyName('InfiniteTech AI');
    setWebsiteUrl('https://www.infinitetechai.com');
    setCallToAction('Visit www.infinitetechai.com or call +91-9884777171 to save 70% of your admin time!');
    setInputMode('text');
    toast.info('Loaded InfiniteTech AI topics', '5 structured social media topics populated.');
  };

  const parsedTopics = inputMode === 'excel' && importedRows.length > 0
    ? importedRows.map(r => r.topic)
    : topicsText.split('\n').map(t => t.trim()).filter(Boolean);

  const togglePlatform = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter(item => item !== p));
      } else {
        toast.warning('At least one platform must remain selected');
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleBulkSchedule = async () => {
    if (parsedTopics.length === 0) {
      toast.error('No topics found', 'Please enter at least one topic or upload an Excel file.');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    if (isNaN(startDateTime.getTime())) {
      toast.error('Invalid Date/Time', 'Please select a valid start date and time.');
      return;
    }

    const itemsToSend = inputMode === 'excel' && importedRows.length > 0
      ? importedRows
      : parsedTopics.map(t => ({ topic: t }));

    const totalCount = itemsToSend.length;
    cancelRequestedRef.current = false;
    pauseRequestedRef.current = false;

    const templateNames = [
      'Teal Corporate Hero', 'Split-Screen Before/After', 'Centered Product Cards',
      'Dark Tech Matrix', 'Minimal Swiss White', 'Vibrant Gradient Mesh',
      'Smartphone Mockup', 'Human+AI Copilot', 'SaaS Dashboard KPI',
      'Neural Constellation', 'Isometric 3D Platform', 'Data Metric Impact'
    ];

    setProgressState({
      isOpen: true,
      current: 1,
      total: totalCount,
      isPaused: false,
      isFinished: false,
      currentTitle: itemsToSend[0]?.topic || parsedTopics[0],
      templateName: `Template #1 (${templateNames[0]})`,
    });

    let currentStep = 1;
    const progressTimer = setInterval(() => {
      if (pauseRequestedRef.current) return;
      if (cancelRequestedRef.current) {
        clearInterval(progressTimer);
        return;
      }
      if (currentStep < totalCount) {
        currentStep++;
        const nextTopic = itemsToSend[currentStep - 1]?.topic || parsedTopics[currentStep - 1] || 'Generating visual...';
        setProgressState(prev => ({
          ...prev,
          current: currentStep,
          currentTitle: nextTopic,
          templateName: `Template #${((currentStep - 1) % 20) + 1} (${templateNames[(currentStep - 1) % templateNames.length]})`,
        }));
      }
    }, 750);

    setGenerating(true);
    try {
      const res = await api.bulkSchedulePosts({
        topics: parsedTopics,
        items: itemsToSend,
        start_date: startDateTime.toISOString(),
        interval_hours: intervalHours,
        timezone,
        company_name: companyName,
        company_description: 'Automate invoicing, data entry, scheduling, and follow-ups. From chaos to control.',
        website_url: websiteUrl,
        marketing_goal: 'Automate Business Operations & Lead Generation',
        tone,
        platforms: selectedPlatforms,
        generate_ai_images: imageMode === 'ai_generate',
        media_id: imageMode === 'shared_flyer' ? selectedMediaId : null,
        call_to_action: callToAction,
      });

      clearInterval(progressTimer);
      setProgressState(prev => ({
        ...prev,
        current: totalCount,
        isFinished: true,
      }));

      setScheduledResult(res.posts);
      await loadMediaLibrary();
      toast.success(
        'Bulk Auto-Posting Scheduled!',
        imageMode === 'ai_generate'
          ? `Created full details & unique AI graphics for all ${res.posts.length} topics!`
          : res.message
      );
    } catch (err: any) {
      clearInterval(progressTimer);
      setProgressState(prev => ({ ...prev, isOpen: false }));
      toast.error('Bulk Scheduling Failed', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const selectedMediaObj = availableMedia.find(m => m.id === selectedMediaId);

  // Helper to find media by ID
  const getMediaById = (id: any) => {
    if (!id) return null;
    return availableMedia.find(m => m.id === Number(id) || String(m.id) === String(id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 border border-indigo-500/20">
            <Zap className="w-3.5 h-3.5 text-indigo-500" />
            <span>Autonomous Bulk Social Media Engine</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Bulk AI Content Generator & Auto-Poster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Provide bulk titles — the AI generates complete multi-platform copy (details, captions, hashtags, CTAs) and produces custom AI graphics for every post automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Clock className="w-4 h-4 text-indigo-400" />}
            onClick={() => navigate('/scheduled')}
          >
            View Auto-Post Queue
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Calendar className="w-4 h-4" />}
            onClick={() => navigate('/calendar')}
          >
            Content Calendar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Topics & Heading Content Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  Post Titles, Headings & Content
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Paste topics manually or upload an Excel spreadsheet with titles, headings, bullets & CTAs!
                </p>
              </div>

              {/* Mode switch pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    inputMode === 'text'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('excel')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition relative ${
                    inputMode === 'excel'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Upload Excel / CSV</span>
                  {importedRows.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-emerald-700 font-extrabold">
                      {importedRows.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Hidden file input for Excel upload */}
            <input
              type="file"
              ref={excelFileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelFileUpload}
              className="hidden"
            />

            {/* Content based on inputMode */}
            {inputMode === 'text' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Topics / Titles (1 per line):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={load10AITopics}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 transition"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>10 AI Topics</span>
                    </button>
                    <button
                      type="button"
                      onClick={loadSampleTopics}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      ⚡ InfiniteTech 5
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInputMode('excel');
                        setTimeout(() => excelFileInputRef.current?.click(), 100);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Upload Excel</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={topicsText}
                  onChange={e => setTopicsText(e.target.value)}
                  placeholder="Title 1: The AI Revolution in 2026: Reshaping Business&#10;Title 2: Zero-Touch Invoicing on Autopilot&#10;Title 3: How Small Teams Outperform Giants with AI&#10;(Add as many titles as you want — 1 per line)"
                  className="w-full p-3.5 text-xs font-sans leading-relaxed bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {importedRows.length === 0 ? (
                  /* Dropzone & Upload Prompt */
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Upload Excel (.xlsx, .xls) or CSV (.csv)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                      Include columns for <strong>Topic</strong>, <strong>Heading</strong> (hook), <strong>Key Details</strong> (bullet points), and <strong>Call To Action</strong>.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => excelFileInputRef.current?.click()}
                        disabled={parsingExcel}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{parsingExcel ? 'Parsing Spreadsheet...' : 'Choose Excel / CSV File'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadDemoExcel}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span>⚡ Load Sample Data (Demo)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSampleExcel}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
                      >
                        <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Download Template (.xlsx)</span>
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Auto-reads Headings & Hooks
                      </span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Splits bullet points automatically
                      </span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> 100% Client-side safe
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Imported Data Table & Actions */
                  <div className="space-y-3">
                    {/* File Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                              {excelFileName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">
                              {importedRows.length} Rows Loaded
                            </span>
                          </div>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                            {importedRows.filter(r => r.heading).length} custom headings • {importedRows.filter(r => r.details && r.details.length > 0).length} bullet detail sets
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => excelFileInputRef.current?.click()}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
                        >
                          <RefreshCw className="w-3 h-3 text-slate-500" />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddRow}
                          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
                        >
                          <span>+ Add Row</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExportExcel}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
                        >
                          <Download className="w-3 h-3 text-indigo-500" />
                          <span>Export (.xlsx)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => excelFileInputRef.current?.click()}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
                        >
                          <RefreshCw className="w-3 h-3 text-slate-500" />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadSampleExcel}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
                        >
                          <Download className="w-3 h-3 text-emerald-600" />
                          <span>Template</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleClearExcel}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Table Preview with Row CRUD and Validation */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                          <tr>
                            <th className="py-2.5 px-3 font-bold w-10">#</th>
                            <th className="py-2.5 px-3 font-bold w-2/5">Post Title</th>
                            <th className="py-2.5 px-3 font-bold w-1/4">Heading / Details</th>
                            <th className="py-2.5 px-3 font-bold w-28">CTA</th>
                            <th className="py-2.5 px-3 font-bold w-20 text-center">Status</th>
                            <th className="py-2.5 px-3 font-bold w-20 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {importedRows.map((row, idx) => {
                            const isInvalid = !row.topic || row.topic.startsWith('(Untitled');
                            return (
                              <tr
                                key={idx}
                                className={`transition ${
                                  isInvalid
                                    ? 'bg-rose-50/60 dark:bg-rose-950/20'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-400 align-top">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-3 align-top">
                                  <input
                                    type="text"
                                    value={row.topic}
                                    onChange={e => handleUpdateRowField(idx, 'topic', e.target.value)}
                                    className={`w-full px-2 py-1 text-xs rounded border font-semibold bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 ${
                                      isInvalid
                                        ? 'border-rose-400 text-rose-700 dark:text-rose-300 focus:ring-rose-500'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-indigo-500'
                                    }`}
                                    placeholder="Enter post title..."
                                  />
                                </td>
                                <td className="py-2 px-3 align-top">
                                  <input
                                    type="text"
                                    value={row.heading || ''}
                                    onChange={e => handleUpdateRowField(idx, 'heading', e.target.value)}
                                    className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-1"
                                    placeholder="Optional headline / hook..."
                                  />
                                  {row.details && row.details.length > 0 ? (
                                    <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                                      • {row.details.join(' • ')}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic block">
                                      AI will generate bullets
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 align-top">
                                  <input
                                    type="text"
                                    value={row.call_to_action || ''}
                                    onChange={e => handleUpdateRowField(idx, 'call_to_action', e.target.value)}
                                    className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    placeholder="CTA..."
                                  />
                                </td>
                                <td className="py-2 px-3 align-top text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isInvalid
                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                                    }`}
                                  >
                                    {isInvalid ? 'Invalid' : 'Valid'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 align-top text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateRow(idx)}
                                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                      title="Duplicate row"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRow(idx)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                      title="Delete row"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 gap-1">
              <span className="font-semibold">
                {parsedTopics.length} titles ready to publish
                {inputMode === 'excel' && importedRows.length > 0 && ` (from ${excelFileName})`}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Will generate {parsedTopics.length} unique details & {parsedTopics.length * selectedPlatforms.length} scheduled posts
              </span>
            </div>
          </div>

          {/* 2. Visual Creative / Image Strategy Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  Image & Creative Graphic Strategy
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose how images are assigned to your bulk posts:
                </p>
              </div>
            </div>

            {/* 3 Strategy Modes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: AI Generate Graphic per Topic */}
              <div
                onClick={() => setImageMode('ai_generate')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                  imageMode === 'ai_generate'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">
                      Recommended
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Auto-Generate Unique AI Graphic
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Local engine creates custom 1080x1080 dark aurora graphics for each topic headline automatically.
                  </p>
                </div>
                {imageMode === 'ai_generate' && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Selected ({parsedTopics.length} unique cards)</span>
                  </div>
                )}
              </div>

              {/* Option 2: Shared Flyer */}
              <div
                onClick={() => setImageMode('shared_flyer')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                  imageMode === 'shared_flyer'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Shared Flyer / Upload
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Attach one common flyer or company brochure to every post in this scheduled batch.
                  </p>
                </div>
                {imageMode === 'shared_flyer' && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Selected (Single Flyer)</span>
                  </div>
                )}
              </div>

              {/* Option 3: Text Only */}
              <div
                onClick={() => setImageMode('none')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                  imageMode === 'none'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-slate-600/10 text-slate-600 dark:text-slate-400">
                      <Layers className="w-4 h-4" />
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Text Only
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Generate multi-platform captions, headlines, and hashtags without any image attachment.
                  </p>
                </div>
                {imageMode === 'none' && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Selected (Text Only)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mode-Specific Controls */}
            {imageMode === 'ai_generate' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-slate-900 border border-indigo-500/40 overflow-hidden shrink-0 flex flex-col justify-between p-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] font-bold text-indigo-400 bg-indigo-950 px-1 py-0.5 rounded">AI CARD</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="text-[9px] font-extrabold text-white leading-tight">
                    TOPIC HEADLINE
                  </div>
                  <div className="text-[7px] text-indigo-300 border-t border-slate-800 pt-1">
                    1080 × 1080 px
                  </div>
                </div>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Fully Automated Visual Generation</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    When you click generate, each of the {parsedTopics.length} topics will be converted into high-converting social graphics with dark aurora aesthetics, headline wrapping, badges, and company contact info.
                  </p>
                </div>
              </div>
            )}

            {imageMode === 'shared_flyer' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Flyer or Upload New Media
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <select
                    value={selectedMediaId || ''}
                    onChange={e => setSelectedMediaId(e.target.value ? Number(e.target.value) : null)}
                    className="flex-1 w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableMedia.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.original_filename} ({m.width ? `${m.width}x${m.height}` : m.mime_type})
                      </option>
                    ))}
                  </select>

                  <input
                    type="file"
                    ref={flyerFileInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleUploadFlyer}
                  />
                  <button
                    type="button"
                    disabled={uploadingFlyer}
                    onClick={() => flyerFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shrink-0 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingFlyer ? 'Uploading...' : 'Upload New Flyer'}</span>
                  </button>
                </div>

                {selectedMediaObj && (
                  <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <img
                      src={selectedMediaObj.url}
                      alt={selectedMediaObj.alt_text || 'Flyer preview'}
                      className="w-12 h-14 object-cover rounded shadow-sm border border-slate-300 dark:border-slate-700 shrink-0"
                    />
                    <div className="text-xs overflow-hidden">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {selectedMediaObj.original_filename}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {selectedMediaObj.width} × {selectedMediaObj.height} px
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Schedule Cadence */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              Autonomous Scheduling Cadence
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Posting Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cadence / Interval
                </label>
                <select
                  value={intervalHours}
                  onChange={e => setIntervalHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={12}>Twice Daily (Every 12h)</option>
                  <option value={24}>Daily (Every 24h at same time)</option>
                  <option value={48}>Every 2 Days (48h)</option>
                  <option value={72}>Every 3 Days (72h)</option>
                  <option value={168}>Weekly (Every 7 Days)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Target Platforms & Brand Context */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">4</span>
              Target Platforms & Brand Identity
            </h3>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Publishing Platforms (Select All to maximize audience reach)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatforms(['facebook', 'instagram', 'linkedin', 'twitter', 'threads', 'youtube', 'pinterest'])}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPlatforms(['facebook'])}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: 'facebook', label: 'Facebook Page', color: 'bg-[#1877F2]' },
                  { id: 'instagram', label: 'Instagram Professional', color: 'bg-[#E4405F]' },
                  { id: 'linkedin', label: 'LinkedIn Company', color: 'bg-[#0A66C2]' },
                  { id: 'twitter', label: 'X (Twitter)', color: 'bg-[#1DA1F2]' },
                  { id: 'threads', label: 'Threads', color: 'bg-black dark:bg-white' },
                  { id: 'youtube', label: 'YouTube Community', color: 'bg-[#FF0000]' },
                  { id: 'pinterest', label: 'Pinterest', color: 'bg-[#BD081C]' },
                ].map(p => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition ${
                      selectedPlatforms.includes(p.id)
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(p.id)}
                      onChange={() => togglePlatform(p.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className={`w-2 h-2 rounded-full ${p.color}`} />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Product Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Call to Action & Contact
              </label>
              <input
                type="text"
                value={callToAction}
                onChange={e => setCallToAction(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Trigger Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full py-4 text-base font-bold shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50"
            icon={<Sparkles className="w-5 h-5" />}
            loading={generating}
            onClick={handleBulkSchedule}
          >
            {generating
              ? `Generating Details & AI Images (${parsedTopics.length} Topics)...`
              : `⚡ Generate Details, AI Images & Auto-Schedule All ${parsedTopics.length} Posts`}
          </Button>
        </div>

        {/* Right Column: Schedule Timeline Preview or Live Results */}
        <div className="lg:col-span-5 space-y-6">
          {scheduledResult ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Successfully Generated & Scheduled ({scheduledResult.length})
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Clock className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/scheduled')}
                >
                  View Queue
                </Button>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
                ✅ Complete post details, platform captions, hashtags, and AI graphics have been generated and saved into your publishing queue!
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {scheduledResult.map((post, idx) => {
                  const firstP = post.platform_posts[0];
                  const schedTime = firstP?.scheduled_at ? new Date(firstP.scheduled_at).toLocaleString() : 'Scheduled';
                  const mediaId = firstP?.media_ids?.[0];
                  const mediaObj = getMediaById(mediaId);

                  return (
                    <div
                      key={post.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          Post #{idx + 1}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          ⏰ {schedTime}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        {mediaObj ? (
                          <img
                            src={mediaObj.url}
                            alt="Generated Graphic"
                            className="w-16 h-16 object-cover rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                            No Image
                          </div>
                        )}
                        <div className="space-y-1 overflow-hidden flex-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {post.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {firstP?.caption}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          {post.platform_posts.map(pp => (
                            <Badge key={pp.id} variant={pp.platform as any} size="sm">
                              {pp.platform.toUpperCase()}
                            </Badge>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/scheduled')}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Post</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  icon={<Calendar className="w-4 h-4" />}
                  onClick={() => navigate('/calendar')}
                >
                  View in Content Calendar
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Projected Auto-Publishing Timeline
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {intervalHours}h cadence
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Here is when each topic will be automatically dispatched across Facebook, Instagram, LinkedIn, and X:
              </p>

              <div className="space-y-2.5">
                {parsedTopics.slice(0, 7).map((topic, i) => {
                  const base = new Date(`${startDate}T${startTime}:00`);
                  if (!isNaN(base.getTime())) {
                    base.setHours(base.getHours() + i * intervalHours);
                  }
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 text-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div className="space-y-0.5 overflow-hidden flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {topic}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                            {isNaN(base.getTime()) ? '—' : base.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {inputMode === 'excel' && importedRows[i]?.heading && (
                          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1">
                            <span>🎯 Hook:</span>
                            <span className="italic">"{importedRows[i].heading}"</span>
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400">
                          {imageMode === 'ai_generate'
                            ? '✨ Generates custom AI social graphic + multi-platform copy'
                            : imageMode === 'shared_flyer'
                            ? '🖼️ Posts with attached shared marketing flyer'
                            : '📝 Posts text copy & hashtags without image'}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {parsedTopics.length > 7 && (
                  <p className="text-center text-[11px] text-slate-400 pt-1">
                    + {parsedTopics.length - 7} more topics scheduled sequentially
                  </p>
                )}
              </div>

              {imageMode === 'shared_flyer' && selectedMediaObj && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                  <img
                    src={selectedMediaObj.url}
                    alt="Attached Flyer"
                    className="w-12 h-16 object-cover rounded shadow-sm border border-slate-300 dark:border-slate-600 shrink-0"
                  />
                  <div className="text-xs text-slate-500">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Attached Example Flyer
                    </p>
                    <p className="text-[11px]">
                      {selectedMediaObj.original_filename} will be uploaded alongside each generated caption.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Generation Progress Modal (Section 38 Requirement) */}
      {progressState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  {progressState.isFinished ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {progressState.isFinished ? 'Bulk Generation Complete!' : 'Autonomous Generation in Progress'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {progressState.isFinished
                      ? `Generated and scheduled all ${progressState.total} campaigns.`
                      : 'Creating platform copy & rendering brand flyers sequentially.'}
                  </p>
                </div>
              </div>

              {progressState.isFinished && (
                <button
                  onClick={() => setProgressState(prev => ({ ...prev, isOpen: false }))}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Step Counter & Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                  Generating {progressState.current} / {progressState.total}
                </span>
                <span className="text-slate-500 font-mono">
                  {Math.round((progressState.current / Math.max(1, progressState.total)) * 100)}%
                </span>
              </div>

              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((progressState.current / Math.max(1, progressState.total)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Currently Processing Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Active Topic:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {progressState.templateName || '20-Family Layout Rotation'}
                </span>
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                "{progressState.currentTitle || 'Processing topic...'}"
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" /> High-Res 1080×1080 Graphic
                </span>
                <span>•</span>
                <span>7 Platform Captions & Tags</span>
              </div>
            </div>

            {/* Progress Actions */}
            <div className="flex items-center justify-between pt-2">
              {!progressState.isFinished ? (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextPaused = !progressState.isPaused;
                        pauseRequestedRef.current = nextPaused;
                        setProgressState(prev => ({ ...prev, isPaused: nextPaused }));
                        if (nextPaused) toast.info('Generation Paused');
                        else toast.info('Generation Resumed');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      {progressState.isPaused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        cancelRequestedRef.current = true;
                        setProgressState(prev => ({ ...prev, isOpen: false }));
                        toast.warning('Generation Cancelled', 'Completed posts have been preserved.');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 italic">
                    Do not close tab
                  </span>
                </>
              ) : (
                <div className="flex items-center justify-end gap-3 w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setProgressState(prev => ({ ...prev, isOpen: false }));
                      navigate('/scheduled');
                    }}
                  >
                    View Queue ({scheduledResult?.length || progressState.total})
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setProgressState(prev => ({ ...prev, isOpen: false }));
                      navigate('/preview');
                    }}
                  >
                    Inspect in Live Preview →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
