import React from 'react';
import { Partnership } from '../types/partnership';
import { calculateClearancePercentage, calculateDaysToExpiry } from '../data/initialPartnerships';
import { ShieldCheck, AlertTriangle, Flame, Layers, Clock, Building2 } from 'lucide-react';

interface KPISummaryProps {
  partnerships: Partnership[];
  onFilterByStage?: (stage: string) => void;
  onFilterByAlert?: () => void;
}

export const KPISummary: React.FC<KPISummaryProps> = ({ partnerships, onFilterByStage, onFilterByAlert }) => {
  const total = partnerships.length;

  const highPriorityCount = partnerships.filter((p) => p.priority === 'High').length;

  // Stages count
  const stageCounts = {
    exploration: partnerships.filter((p) => p.stage === '1. Exploration').length,
    negotiation: partnerships.filter((p) => p.stage === '2. Negotiation').length,
    approvals: partnerships.filter((p) => p.stage === '3. Internal Approvals').length,
    signature: partnerships.filter((p) => p.stage === '4. Signature').length,
    onHold: partnerships.filter((p) => p.stage === '0. On Hold').length,
  };

  // Renewal alerts count (daysToExpiry <= 90)
  const alertCount = partnerships.filter((p) => {
    const days = calculateDaysToExpiry(p.expiryDate);
    return days !== null && days <= (p.renewalNoticeDays || 90);
  }).length;

  // Average clearance %
  const avgClearance = total > 0
    ? Math.round(
        partnerships.reduce((sum, p) => sum + calculateClearancePercentage(p), 0) / total
      )
    : 0;

  // Entity breakdown
  const bmEntityCount = partnerships.filter((p) => p.entity === 'Banque Misr').length;
  const mfiEntityCount = partnerships.filter((p) => p.entity === 'MFI').length;

  return (
    <div id="kpi-summary-bar" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {/* KPI 1: Total Portfolio */}
      <div id="kpi-total-partnerships" className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Register</span>
          <span className="p-2 bg-slate-100 text-slate-700 rounded-lg">
            <Building2 className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-xs text-slate-500 font-medium">
            {bmEntityCount} BM • {mfiEntityCount} MFI
          </span>
        </div>
        <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
          <div
            className="bg-[#701627] h-full"
            style={{ width: `${total > 0 ? (bmEntityCount / total) * 100 : 0}%` }}
            title={`Banque Misr: ${bmEntityCount}`}
          />
          <div
            className="bg-amber-500 h-full"
            style={{ width: `${total > 0 ? (mfiEntityCount / total) * 100 : 0}%` }}
            title={`MFI: ${mfiEntityCount}`}
          />
        </div>
      </div>

      {/* KPI 2: High Priority Count */}
      <div id="kpi-high-priority" className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">High Priority</span>
          <span className="p-2 bg-red-50 text-red-600 rounded-lg">
            <Flame className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-[#701627]">{highPriorityCount}</span>
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
            {total > 0 ? Math.round((highPriorityCount / total) * 100) : 0}% of Total
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 truncate">
          Key strategic relationship focus
        </p>
      </div>

      {/* KPI 3: Pipeline Stage Progress */}
      <div id="kpi-pipeline-breakdown" className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pipeline Stages</span>
          <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Layers className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] font-semibold">
          <div
            onClick={() => onFilterByStage?.('1. Exploration')}
            className="bg-blue-50 text-blue-700 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors"
            title="Exploration"
          >
            <div className="text-sm font-bold">{stageCounts.exploration}</div>
            <div className="truncate">Expl.</div>
          </div>
          <div
            onClick={() => onFilterByStage?.('2. Negotiation')}
            className="bg-purple-50 text-purple-700 py-1 rounded cursor-pointer hover:bg-purple-100 transition-colors"
            title="Negotiation"
          >
            <div className="text-sm font-bold">{stageCounts.negotiation}</div>
            <div className="truncate">Nego.</div>
          </div>
          <div
            onClick={() => onFilterByStage?.('3. Internal Approvals')}
            className="bg-indigo-50 text-indigo-700 py-1 rounded cursor-pointer hover:bg-indigo-100 transition-colors"
            title="Internal Approvals"
          >
            <div className="text-sm font-bold">{stageCounts.approvals}</div>
            <div className="truncate">Appr.</div>
          </div>
          <div
            onClick={() => onFilterByStage?.('4. Signature')}
            className="bg-emerald-50 text-emerald-700 py-1 rounded cursor-pointer hover:bg-emerald-100 transition-colors"
            title="Signature / Active"
          >
            <div className="text-sm font-bold">{stageCounts.signature}</div>
            <div className="truncate">Sign.</div>
          </div>
        </div>
      </div>

      {/* KPI 4: Average Strategic Value Clearance % */}
      <div id="kpi-clearance-percentage" className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Value Clearance</span>
          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-emerald-700">{avgClearance}%</span>
          <span className="text-[11px] text-slate-500">Auto Formula</span>
        </div>
        <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${avgClearance}%` }}
          />
        </div>
      </div>

      {/* KPI 5: Renewal & Expiry Alerts */}
      <div
        id="kpi-renewal-alerts"
        onClick={onFilterByAlert}
        className={`rounded-xl p-4 shadow-xs border transition-all cursor-pointer ${
          alertCount > 0
            ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/60'
            : 'bg-white border-slate-200/80 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Renewal Alerts</span>
          <span className={`p-2 rounded-lg ${alertCount > 0 ? 'bg-amber-200/80 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className={`text-2xl font-bold ${alertCount > 0 ? 'text-amber-900' : 'text-slate-800'}`}>
            {alertCount}
          </span>
          <span className="text-[11px] font-medium text-slate-600">
            Within 90-day Notice
          </span>
        </div>
        <p className="mt-2 text-[11px] text-amber-800 font-medium flex items-center gap-1 truncate">
          <Clock className="w-3 h-3 inline shrink-0" /> Click to view expiring contracts
        </p>
      </div>
    </div>
  );
};
