import React from 'react';
import { Partnership, HealthStatus } from '../types/partnership';
import {
  calculateClearancePercentage,
  calculateDaysToExpiry,
  getRenewalAlert,
} from '../data/initialPartnerships';
import { X, Calendar, ShieldCheck, UserCheck, CheckCircle2, AlertTriangle, FileText, Edit2, Activity } from 'lucide-react';

interface PartnershipDetailDrawerProps {
  partnership: Partnership | null;
  onClose: () => void;
  onEdit: (partnership: Partnership) => void;
  onUpdateHealthStatus?: (id: string, healthStatus: HealthStatus) => void;
}

export const PartnershipDetailDrawer: React.FC<PartnershipDetailDrawerProps> = ({
  partnership,
  onClose,
  onEdit,
  onUpdateHealthStatus,
}) => {
  if (!partnership) return null;

  const clearance = calculateClearancePercentage(partnership);
  const daysToExpiry = calculateDaysToExpiry(partnership.expiryDate);
  const renewalAlert = getRenewalAlert(daysToExpiry, partnership.renewalNoticeDays);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-6 bg-[#701627] text-white flex items-start justify-between border-b border-[#54101d]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-amber-200">
                {partnership.id}
              </span>
              <span className="text-xs bg-red-950/60 px-2 py-0.5 rounded border border-red-500/40 text-red-100">
                {partnership.entity}
              </span>
            </div>
            <h2 className="text-xl font-bold">{partnership.partnerName}</h2>
            <p className="text-xs text-red-100 opacity-90">{partnership.category}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(partnership)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Edit Partnership"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Pipeline Stage</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">
                {partnership.stage}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Priority</span>
              <span
                className={`inline-block text-xs font-extrabold px-2.5 py-0.5 rounded mt-1 ${
                  partnership.priority === 'High'
                    ? 'bg-red-100 text-[#701627]'
                    : partnership.priority === 'Medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {partnership.priority} Priority
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase flex items-center justify-between">
                <span>Health Status</span>
                <span className="text-[9px] text-emerald-600 flex items-center gap-0.5 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Validated
                </span>
              </span>
              <div className="mt-1">
                {onUpdateHealthStatus ? (
                  <select
                    value={partnership.healthStatus || 'Green'}
                    onChange={(e) => onUpdateHealthStatus(partnership.id, e.target.value as HealthStatus)}
                    className={`w-full px-2 py-1 rounded text-xs font-bold border cursor-pointer focus:outline-none ${
                      (partnership.healthStatus || 'Green') === 'Green'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : (partnership.healthStatus || 'Green') === 'Amber'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : (partnership.healthStatus || 'Green') === 'Red'
                        ? 'bg-red-50 text-red-800 border-red-300'
                        : 'bg-blue-50 text-blue-800 border-blue-300'
                    }`}
                  >
                    <option value="Green">● Green (On Track)</option>
                    <option value="Amber">▲ Amber (Attention)</option>
                    <option value="Red">■ Red (Blocked)</option>
                    <option value="Completed">✓ Completed</option>
                  </select>
                ) : (
                  <span
                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                      (partnership.healthStatus || 'Green') === 'Green'
                        ? 'bg-emerald-100 text-emerald-800'
                        : (partnership.healthStatus || 'Green') === 'Amber'
                        ? 'bg-amber-100 text-amber-800'
                        : (partnership.healthStatus || 'Green') === 'Red'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {partnership.healthStatus || 'Green'}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Document Type</span>
              <span className="text-xs font-bold text-slate-900 mt-1 block">
                {partnership.documentType}
              </span>
              <span className="text-[10px] text-slate-500">{partnership.documentStatus}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Value Clearance</span>
              <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                {clearance}%
              </span>
              <span className="text-[10px] text-slate-500">Auto Formula Result</span>
            </div>
          </div>

          {/* Renewal & Expiry Alert */}
          <div className={`p-4 rounded-xl border ${renewalAlert.badgeColor}`}>
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Contract Expiry & Renewal Status</span>
            </div>
            <div className="mt-2 text-xs space-y-1">
              <div><strong>Expiry Date:</strong> {partnership.expiryDate || 'Not specified'}</div>
              <div><strong>Days to Expiry:</strong> {daysToExpiry !== null ? `${daysToExpiry} days` : 'N/A'}</div>
              <div><strong>Notice Window:</strong> {partnership.renewalNoticeDays || 90} days</div>
            </div>
          </div>

          {/* Scope / Purpose List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#701627]" /> Scope & Purpose
            </h3>
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80">
              <ul className="space-y-2 text-xs text-slate-800">
                {partnership.scope.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Value Drivers Matrix */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" /> Strategic Value Drivers
            </h3>
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span>Growth & Value Creation Engine</span>
                <span className={partnership.valueDrivers.growthEngine ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {partnership.valueDrivers.growthEngine ? '✓ Active' : '✕ No'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span>Next Growth - Venture Clienting</span>
                <span className={partnership.valueDrivers.ventureClienting ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {partnership.valueDrivers.ventureClienting ? '✓ Active' : '✕ No'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span>Next Growth - Start Up friendly Bank</span>
                <span className={partnership.valueDrivers.startupFriendlyBank ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {partnership.valueDrivers.startupFriendlyBank ? '✓ Active' : '✕ No'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span>Ecosystem Engagement</span>
                <span className={partnership.valueDrivers.ecosystemEngagement ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {partnership.valueDrivers.ecosystemEngagement ? '✓ Active' : '✕ No'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Investment</span>
                <span className={partnership.valueDrivers.investment ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {partnership.valueDrivers.investment ? '✓ Active' : '✕ No'}
                </span>
              </div>
            </div>
          </div>

          {/* SPOCs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-500 block mb-1">Internal SPOC</span>
              <span className="font-bold text-slate-800">{partnership.internalSPOC || 'Mina Armanious'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-500 block mb-1">Partner SPOC</span>
              <span className="font-bold text-slate-800">{partnership.partnerSPOC || 'TBD'}</span>
            </div>
          </div>

          {/* Notes */}
          {partnership.notes && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Notes & Next Actions
              </h3>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                {partnership.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {partnership.isUserFilled ? 'Editable Record' : 'Baseline Import'}
          </span>
          <button
            onClick={() => onEdit(partnership)}
            className="px-4 py-2 bg-[#701627] text-white text-xs font-bold rounded-lg hover:bg-red-900 transition-colors cursor-pointer"
          >
            Edit Record
          </button>
        </div>
      </div>
    </div>
  );
};
