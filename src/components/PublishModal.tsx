import React, { useState } from 'react';
import {
  Globe,
  X,
  Copy,
  Check,
  ExternalLink,
  Radio,
  Share2,
  Sparkles,
  CheckCircle2,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Partnership } from '../types/partnership';
import { getShareablePublishUrl, publishPartnerships } from '../utils/publishUtils';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerships: Partnership[];
  publishedTimestamp: string | null;
  onPublishedSuccess: (timestamp: string) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  partnerships,
  publishedTimestamp,
  onPublishedSuccess,}) => {
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState<string | null>(publishedTimestamp);

  if (!isOpen) return null;

  const currentShareUrl = getShareablePublishUrl(partnerships);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePublishNow = async () => {
    setIsPublishing(true);
    const result = publishPartnerships(partnerships);
    setCurrentTimestamp(result.timestamp);
    onPublishedSuccess(result.timestamp);
    setIsPublishing(false);

    // Auto copy on explicit publish click
    navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-xl text-emerald-300 ring-1 ring-white/20">
              <Globe className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                Publish & Share Live Register
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-400 text-emerald-950 rounded-full tracking-wider">
                  Instant Link
                </span>
              </h2>
              <p className="text-xs text-emerald-100 opacity-90">
                Anyone opening your shared link will immediately see your latest published changes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <p className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                Register Ready for Instant Distribution
                {currentTimestamp && (
                  <span className="text-[11px] font-normal text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/60">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Published {currentTimestamp}
                  </span>
                )}
              </p>
              <p className="text-emerald-800 leading-relaxed">
                Your dataset containing <strong>{partnerships.length} active partnerships</strong> is encoded directly into the share URL payload. Recipients do not need logins or special database access to view the published register.
              </p>
            </div>
          </div>

          {/* Share Link Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                Live Published Link
              </span>
              <span className="text-[11px] text-slate-400 font-normal">URL contains live snapshot state</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={currentShareUrl}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-700 select-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instant Share Features Overview */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center text-center">
              <Radio className="w-5 h-5 text-emerald-600 mb-1.5 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">Instant Broadcast</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Real-time sync across open tabs</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center text-center">
              <ShieldCheck className="w-5 h-5 text-teal-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Zero Dependencies</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Embedded compressed payload</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center text-center">
              <Layers className="w-5 h-5 text-amber-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">{partnerships.length} Items</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Full governance register</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <a
            href={currentShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Test Open Shared View</span>
          </a>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              disabled={isPublishing}
              onClick={handlePublishNow}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Publishing Changes...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 text-emerald-200" />
                  <span>Publish & Copy Share Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
