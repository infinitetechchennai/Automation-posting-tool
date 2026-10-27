import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'error'
    | 'info'
    | 'indigo'
    | 'teal'
    | 'neutral'
    | 'outline'
    | 'facebook'
    | 'instagram'
    | 'linkedin'
    | 'twitter'
    | 'threads'
    | 'youtube'
    | 'pinterest';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const base = "inline-flex items-center font-medium rounded-full";

  const variants: Record<string, string> = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
    success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60",
    warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60",
    danger: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60",
    error: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60",
    info: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60",
    indigo: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60",
    teal: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60",
    neutral: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
    outline: "bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700",
    facebook: "bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/30",
    instagram: "bg-[#E4405F]/10 text-[#E4405F] border border-[#E4405F]/30",
    linkedin: "bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/30",
    twitter: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30",
    threads: "bg-slate-900/10 dark:bg-slate-100/10 text-slate-900 dark:text-slate-100 border border-slate-900/20 dark:border-slate-100/20",
    youtube: "bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/30",
    pinterest: "bg-[#BD081C]/10 text-[#BD081C] border border-[#BD081C]/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
