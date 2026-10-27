import React from 'react';
import { ThumbsUp, MessageSquare, Repeat2, Send, Globe, MoreHorizontal } from 'lucide-react';

interface LinkedInPreviewProps {
  authorName?: string;
  tagline?: string;
  caption: string;
  mediaUrl?: string;
  hashtags?: string[];
  websiteUrl?: string;
}

export const LinkedInPreview: React.FC<LinkedInPreviewProps> = ({
  authorName = 'Founder & Executive Leader',
  tagline = 'Building AI-Driven Automation • Founder @ SocialPilot',
  caption,
  mediaUrl,
  hashtags = [],
  websiteUrl,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden text-slate-900 dark:text-slate-100 font-sans max-w-lg mx-auto">
      {/* Header */}
      <div className="p-3.5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#0A66C2] text-white font-bold flex items-center justify-center text-sm shadow">
            {authorName.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-sm leading-tight text-slate-900 dark:text-slate-100">
              {authorName}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[280px]">
              {tagline}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
              <span>Just now</span>
              <span>•</span>
              <Globe className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 p-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Caption Content */}
      <div className="px-3.5 pb-3 text-xs leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
        {caption || <span className="text-slate-400 italic">No LinkedIn post content yet...</span>}
      </div>

      {/* Media or Link card */}
      {mediaUrl ? (
        <div className="w-full bg-slate-100 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
          <img
            src={mediaUrl}
            alt="LinkedIn preview asset"
            className="w-full h-auto max-h-[520px] object-contain"
          />
        </div>
      ) : websiteUrl ? (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
          <span className="text-[10px] font-mono uppercase text-slate-500">
            {new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).hostname}
          </span>
          <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5">
            Official Initiative & Resource Center
          </div>
        </div>
      ) : null}

      {/* Footer Actions */}
      <div className="px-2 py-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-around text-slate-600 dark:text-slate-400 text-xs font-semibold">
        <button className="flex items-center gap-1.5 py-1.5 px-2.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <ThumbsUp className="w-4 h-4 text-blue-600" />
          <span>Like</span>
        </button>
        <button className="flex items-center gap-1.5 py-1.5 px-2.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>Comment</span>
        </button>
        <button className="flex items-center gap-1.5 py-1.5 px-2.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <Repeat2 className="w-4 h-4 text-indigo-600" />
          <span>Repost</span>
        </button>
        <button className="flex items-center gap-1.5 py-1.5 px-2.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </div>
      <div className="bg-slate-50 dark:bg-slate-950/40 text-[10px] text-center py-1 text-slate-400 border-t border-slate-100 dark:border-slate-800">
        Realistic LinkedIn Professional Mockup (No simulated vanity stats)
      </div>
    </div>
  );
};
