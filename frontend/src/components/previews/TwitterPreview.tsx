import React from 'react';
import { MessageCircle, Repeat2, Heart, Bookmark, Share, AlertTriangle } from 'lucide-react';

interface TwitterPreviewProps {
  accountHandle?: string;
  displayName?: string;
  caption: string;
  mediaUrl?: string;
  hashtags?: string[];
}

export const TwitterPreview: React.FC<TwitterPreviewProps> = ({
  accountHandle = '@socialpilot_ai',
  displayName = 'SocialPilot AI',
  caption,
  mediaUrl,
  hashtags = [],
}) => {
  const charCount = caption.length;
  const isOverLimit = charCount > 280;
  const isCloseToLimit = charCount > 260 && !isOverLimit;

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-slate-900 dark:text-slate-100 font-sans max-w-lg mx-auto">
      {/* Header and Content in Twitter Left-Avatar Layout */}
      <div className="p-4 flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-extrabold flex items-center justify-center text-sm shrink-0">
          {displayName.charAt(0)}
        </div>

        {/* Tweet body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline cursor-pointer">
              {displayName}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              {accountHandle}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">1m</span>
          </div>

          <div className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-900 dark:text-slate-100">
            {caption || <span className="text-slate-400 italic">No tweet text generated yet...</span>}
          </div>

          {/* Attached Media */}
          {mediaUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <img
                src={mediaUrl}
                alt="Tweet attachment"
                className="w-full h-auto max-h-[480px] object-contain"
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-slate-500 text-xs max-w-md">
            <button className="flex items-center gap-1 hover:text-sky-500 transition">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1 hover:text-emerald-500 transition">
              <Repeat2 className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1 hover:text-rose-500 transition">
              <Heart className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1 hover:text-amber-500 transition">
              <Bookmark className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1 hover:text-indigo-500 transition">
              <Share className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Character Limit Badge */}
      <div className={`px-4 py-2 border-t text-xs flex items-center justify-between font-mono ${
        isOverLimit
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          : isCloseToLimit
          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
          : 'bg-slate-50 dark:bg-slate-950/60 text-slate-500 border-slate-100 dark:border-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 font-sans">
          {isOverLimit && <AlertTriangle className="w-3.5 h-3.5" />}
          <span>
            {isOverLimit
              ? 'Exceeds Twitter 280-char limit! Edit caption before posting.'
              : 'X (Twitter) Length Validation'}
          </span>
        </div>
        <span className="font-bold">
          {charCount} / 280
        </span>
      </div>
    </div>
  );
};
