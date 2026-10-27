import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface PlatformPostSummary {
  id?: number;
  platform: string;
  caption: string;
  mediaUrl?: string;
  accountName?: string;
}

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedPlatformIds?: number[]) => Promise<void>;
  platformPosts: PlatformPostSummary[];
  loading?: boolean;
}

export const PublishConfirmModal: React.FC<PublishConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  platformPosts,
  loading = false,
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    platformPosts.map(p => p.platform)
  );

  const togglePlatform = (pName: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(pName) ? prev.filter(p => p !== pName) : [...prev, pName]
    );
  };

  const handlePublish = async () => {
    const selectedIds = platformPosts
      .filter(p => selectedPlatforms.includes(p.platform) && p.id)
      .map(p => p.id as number);
    await onConfirm(selectedIds.length > 0 ? selectedIds : undefined);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Multi-Platform Publishing"
      description="Review final captions, platform accounts, and attached media before triggering background publishing jobs."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Independent Platform Isolation</div>
            <div>
              Each selected channel is queued as an independent background worker job. The failure of one platform will not abort other platforms.
            </div>
          </div>
        </div>

        {/* Channels List */}
        <div className="space-y-3">
          {platformPosts.map(p => {
            const isSelected = selectedPlatforms.includes(p.platform);
            return (
              <div
                key={p.platform}
                onClick={() => togglePlatform(p.platform)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <Badge variant={p.platform as any} size="sm">
                      {p.platform.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {p.accountName || `Default ${p.platform} Account`}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {p.caption.length} chars
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 font-sans">
                  {p.caption}
                </p>

                {p.mediaUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={p.mediaUrl}
                      alt="Attachment preview"
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    <span className="text-[11px] text-slate-500">1 media asset attached</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<Send className="w-4 h-4" />}
            onClick={handlePublish}
            loading={loading}
            disabled={selectedPlatforms.length === 0}
          >
            Publish Now ({selectedPlatforms.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
