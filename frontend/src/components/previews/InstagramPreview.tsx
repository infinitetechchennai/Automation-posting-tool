import React from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Image as ImageIcon } from 'lucide-react';

interface InstagramPreviewProps {
  accountName?: string;
  caption: string;
  mediaUrl?: string;
  hashtags?: string[];
}

export const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  accountName = 'socialpilot.ai',
  caption,
  mediaUrl,
  hashtags = [],
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-slate-900 dark:text-slate-100 font-sans max-w-sm mx-auto">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200">
              {accountName.charAt(0).toUpperCase()}
            </div>
          </div>
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 tracking-tight">
            {accountName}
          </span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 p-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Main Square Media Asset (Instagram requires media!) */}
      <div className="w-full aspect-square bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt="Instagram feed preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-slate-500" />
            </div>
            <span className="text-xs font-medium">Image Required by Instagram</span>
            <span className="text-[10px] text-slate-500 max-w-[200px]">
              Attach an image in Image Studio or media uploader to complete post.
            </span>
          </div>
        )}
      </div>

      {/* Action Icons */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Heart className="w-5 h-5 text-slate-700 dark:text-slate-300 hover:text-rose-500 cursor-pointer transition" />
          <MessageCircle className="w-5 h-5 text-slate-700 dark:text-slate-300 hover:text-indigo-500 cursor-pointer transition" />
          <Send className="w-5 h-5 text-slate-700 dark:text-slate-300 hover:text-indigo-500 cursor-pointer transition" />
        </div>
        <Bookmark className="w-5 h-5 text-slate-700 dark:text-slate-300 hover:text-amber-500 cursor-pointer transition" />
      </div>

      {/* Caption Content */}
      <div className="px-3 pb-3 text-xs leading-relaxed space-y-1">
        <div>
          <span className="font-bold mr-1.5 text-slate-900 dark:text-slate-100">
            {accountName}
          </span>
          <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {caption || <span className="text-slate-400 italic">No caption generated...</span>}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 pt-1">
          Realistic Instagram Post Preview (No fake engagement numbers)
        </div>
      </div>
    </div>
  );
};
