import React from 'react';
import { ThumbsUp, MessageSquare, Share2, Globe, MoreHorizontal } from 'lucide-react';

interface FacebookPreviewProps {
  pageName?: string;
  caption: string;
  mediaUrl?: string;
  hashtags?: string[];
  websiteUrl?: string;
}

export const FacebookPreview: React.FC<FacebookPreviewProps> = ({
  pageName = 'SocialPilot AI Page',
  caption,
  mediaUrl,
  hashtags = [],
  websiteUrl,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden text-slate-900 dark:text-slate-100 font-sans max-w-lg mx-auto">
      {/* Header */}
      <div className="p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
            {pageName.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight text-slate-900 dark:text-slate-100">
              {pageName}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Just now</span>
              <span>•</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 p-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Caption Content */}
      <div className="px-3.5 pb-3 text-sm whitespace-pre-wrap leading-relaxed">
        {caption || <span className="text-slate-400 italic">No caption generated yet...</span>}
      </div>

      {/* Attached Media */}
      {mediaUrl && (
        <div className="w-full bg-slate-100 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
          <img
            src={mediaUrl}
            alt="Facebook preview asset"
            className="w-full h-auto max-h-[520px] object-contain"
          />
        </div>
      )}

      {/* Website link preview card */}
      {websiteUrl && !mediaUrl && (
        <div className="mx-3.5 mb-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 flex items-center justify-between">
          <div className="truncate">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">
              {new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).hostname}
            </span>
            <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
              Explore official resources & announcements
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="px-3.5 py-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-around text-slate-600 dark:text-slate-400 text-xs font-semibold">
        <button className="flex items-center gap-2 py-1.5 px-3 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <ThumbsUp className="w-4 h-4" />
          <span>Like</span>
        </button>
        <button className="flex items-center gap-2 py-1.5 px-3 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <MessageSquare className="w-4 h-4" />
          <span>Comment</span>
        </button>
        <button className="flex items-center gap-2 py-1.5 px-3 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>
      <div className="bg-slate-50 dark:bg-slate-950/40 text-[10px] text-center py-1 text-slate-400 border-t border-slate-100 dark:border-slate-800">
        Realistic Facebook Page Mockup (Development Preview)
      </div>
    </div>
  );
};
