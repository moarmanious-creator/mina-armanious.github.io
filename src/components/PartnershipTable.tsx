import React, { useState, useMemo } from 'react';
import { Partnership, FilterState, PartnershipStage, PriorityLevel, HealthStatus } from '../types/partnership';
import {
  calculateClearancePercentage,
  calculateDaysToExpiry,
  getRenewalAlert,
} from '../data/initialPartnerships';
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle,
  Sparkles,
  Info,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';

interface PartnershipTableProps {
  partnerships: Partnership[];
  onSelectPartnership: (partnership: Partnership) => void;
  onEditPartnership: (partnership: Partnership) => void;
  onDeletePartnership: (id: string) => void;
  onUpdateStage: (id: string, stage: PartnershipStage) => void;
  onUpdatePriority: (id: string, priority: PriorityLevel) => void;
  onUpdateHealthStatus: (id: string, healthStatus: HealthStatus) => void;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
}

type SortField = 'id' | 'partnerName' | 'category' | 'entity' | 'stage' | 'priority' | 'healthStatus' | 'clearance' | 'expiry';
type SortOrder = 'asc' | 'desc';

export const PartnershipTable: React.FC<PartnershipTableProps> = ({
  partnerships,
  onSelectPartnership,
  onEditPartnership,
  onDeletePartnership,
  onUpdateStage,
  onUpdatePriority,
  onUpdateHealthStatus,
  filterState,
  setFilterState,
}) => {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFormulaHighlight, setShowFormulaHighlight] = useState(true);

  // Extract unique filter options dynamically
  const categories = useMemo(
    () => Array.from(new Set(partnerships.map((p) => p.category))).sort(),
    [partnerships]
  );
  const entities = useMemo(
    () => Array.from(new Set(partnerships.map((p) => p.entity))).sort(),
    [partnerships]
  );
  const stages = useMemo(
    () => [
      '0. On Hold',
      '1. Exploration',
      '2. Negotiation',
      '3. Internal Approvals',
      '4. Signature',
    ],
    []
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredPartnerships = useMemo(() => {
    return partnerships.filter((p) => {
      // Search text filter
      const searchLower = filterState.search.toLowerCase();
      const matchesSearch =
        !filterState.search ||
        p.id.toLowerCase().includes(searchLower) ||
        p.partnerName.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.scope.some((s) => s.toLowerCase().includes(searchLower)) ||
        (p.notes && p.notes.toLowerCase().includes(searchLower));

      const matchesCategory = !filterState.category || p.category === filterState.category;
      const matchesEntity = !filterState.entity || p.entity === filterState.entity;
      const matchesStage = !filterState.stage || p.stage === filterState.stage;
      const matchesStatus = !filterState.documentStatus || p.documentStatus === filterState.documentStatus;
      const matchesPriority = !filterState.priority || p.priority === filterState.priority;
      const matchesHealthStatus = !filterState.healthStatus || p.healthStatus === filterState.healthStatus;

      const matchesAlert =
        filterState.valueDriver === 'RENEWAL_ALERT'
          ? (() => {
              const days = calculateDaysToExpiry(p.expiryDate);
              return days !== null && days <= (p.renewalNoticeDays || 90);
            })()
          : true;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesEntity &&
        matchesStage &&
        matchesStatus &&
        matchesPriority &&
        matchesHealthStatus &&
        matchesAlert
      );
    });
  }, [partnerships, filterState]);

  const sortedPartnerships = useMemo(() => {
    return [...filteredPartnerships].sort((a, b) => {
      let valA: any = a[sortField as keyof Partnership];
      let valB: any = b[sortField as keyof Partnership];

      if (sortField === 'healthStatus') {
        valA = a.healthStatus || 'Green';
        valB = b.healthStatus || 'Green';
      } else if (sortField === 'clearance') {
        valA = calculateClearancePercentage(a);
        valB = calculateClearancePercentage(b);
      } else if (sortField === 'expiry') {
        valA = calculateDaysToExpiry(a.expiryDate) ?? 999999;
        valB = calculateDaysToExpiry(b.expiryDate) ?? 999999;
      }

      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB);
        return sortOrder === 'asc' ? comp : -comp;
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredPartnerships, sortField, sortOrder]);

  const clearFilters = () => {
    setFilterState({
      search: '',
      category: '',
      entity: '',
      stage: '',
      documentStatus: '',
      priority: '',
      healthStatus: '',
      valueDriver: '',
    });
  };

  const hasActiveFilters =
    filterState.search ||
    filterState.category ||
    filterState.entity ||
    filterState.stage ||
    filterState.documentStatus ||
    filterState.priority ||
    filterState.healthStatus ||
    filterState.valueDriver;

  return (
    <div id="register-table-container" className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Top Filter & Toolbar Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-input"
              type="text"
              placeholder="Search by Partner, ID, Scope, Owner..."
              value={filterState.search}
              onChange={(e) => setFilterState((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#701627]/30 focus:border-[#701627]"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              id="filter-category"
              value={filterState.category}
              onChange={(e) => setFilterState((prev) => ({ ...prev, category: e.target.value }))}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#701627]"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Entity Filter */}
            <select
              id="filter-entity"
              value={filterState.entity}
              onChange={(e) => setFilterState((prev) => ({ ...prev, entity: e.target.value }))}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#701627]"
            >
              <option value="">All Entities</option>
              {entities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>

            {/* Stage Filter */}
            <select
              id="filter-stage"
              value={filterState.stage}
              onChange={(e) => setFilterState((prev) => ({ ...prev, stage: e.target.value }))}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#701627]"
            >
              <option value="">All Stages</option>
              {stages.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              id="filter-priority"
              value={filterState.priority}
              onChange={(e) => setFilterState((prev) => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#701627]"
            >
              <option value="">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            {/* Health Status Filter */}
            <select
              id="filter-health-status"
              value={filterState.healthStatus}
              onChange={(e) => setFilterState((prev) => ({ ...prev, healthStatus: e.target.value }))}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#701627]"
            >
              <option value="">All Health Statuses</option>
              <option value="Green">Green (On Track)</option>
              <option value="Amber">Amber (Attention Needed)</option>
              <option value="Red">Red (Blocked / Delayed)</option>
              <option value="Completed">Completed (Signed & Delivered)</option>
            </select>

            {hasActiveFilters && (
              <button
                id="btn-clear-filters"
                onClick={clearFilters}
                className="px-2.5 py-1.5 text-xs text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Legend / View Helper notice */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Showing {sortedPartnerships.length} of {partnerships.length} partnerships
            </span>
            {showFormulaHighlight && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span className="font-medium text-blue-800">BLUE = Editable Input</span> | <span className="font-medium text-slate-900">BLACK = Formula Calculated</span>
              </span>
            )}
          </div>

          <button
            id="toggle-formula-legend"
            onClick={() => setShowFormulaHighlight(!showFormulaHighlight)}
            className="text-[11px] text-slate-500 hover:text-slate-700 underline cursor-pointer"
          >
            {showFormulaHighlight ? 'Hide Legend' : 'Show Excel Legend'}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto min-h-[400px]">
        <table id="partnership-data-table" className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#701627] text-white font-semibold text-[11px] uppercase tracking-wider">
              <th
                onClick={() => handleSort('id')}
                className="py-3 px-3 cursor-pointer hover:bg-[#59111e] transition-colors border-r border-[#8c2438] w-24"
              >
                <div className="flex items-center justify-between">
                  <span>Unique ID</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th
                onClick={() => handleSort('partnerName')}
                className="py-3 px-3 cursor-pointer hover:bg-[#59111e] transition-colors border-r border-[#8c2438] min-w-[170px]"
              >
                <div className="flex items-center justify-between">
                  <span>Partner / Organization</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th
                onClick={() => handleSort('category')}
                className="py-3 px-3 cursor-pointer hover:bg-[#59111e] transition-colors border-r border-[#8c2438] min-w-[160px]"
              >
                <div className="flex items-center justify-between">
                  <span>Partner Category</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th
                onClick={() => handleSort('entity')}
                className="py-3 px-3 cursor-pointer hover:bg-[#59111e] transition-colors border-r border-[#8c2438] w-28"
              >
                <div className="flex items-center justify-between">
                  <span>Entity</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th className="py-3 px-3 border-r border-[#8c2438] w-24">
                Owner
              </th>

              <th className="py-3 px-3 border-r border-[#8c2438] min-w-[220px]">
                Scope / Purpose
              </th>

              <th className="py-3 px-3 border-r border-[#8c2438] min-w-[140px]">
                Document Type & Status
              </th>

              <th
                onClick={() => handleSort('stage')}
                className="py-3 px-3 cursor-pointer hover:bg-[#59111e] transition-colors border-r border-[#8c2438] min-w-[150px]"
              >
                <div className="flex items-center justify-between">
                  <span>Partnership Stage</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th
                onClick={() => handleSort('priority')}
                className="py-3 px-3 cursor-pointer hover:bg-[#59111e] transition-colors border-r border-[#8c2438] w-24 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th
                onClick={() => handleSort('healthStatus')}
                className="py-3 px-3 cursor-pointer hover:bg-[#59111e] transition-colors border-r border-[#8c2438] min-w-[160px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span>Health Status</span>
                    <span className="text-[9px] bg-white/20 text-amber-200 px-1 py-0.2 rounded font-mono font-normal">
                      Validated
                    </span>
                  </div>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th
                onClick={() => handleSort('clearance')}
                className="py-3 px-3 cursor-pointer hover:bg-[#59111e] transition-colors border-r border-[#8c2438] min-w-[140px]"
              >
                <div className="flex items-center justify-between">
                  <span>Value Clearance %</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th
                onClick={() => handleSort('expiry')}
                className="py-3 px-3 cursor-pointer hover:bg-[#59111e] transition-colors border-r border-[#8c2438] min-w-[130px]"
              >
                <div className="flex items-center justify-between">
                  <span>Expiry & Alert</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th className="py-3 px-3 text-center w-24">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {sortedPartnerships.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="font-medium text-slate-700">No partnerships found matching your filters</p>
                    <button
                      onClick={clearFilters}
                      className="mt-3 text-xs text-[#701627] font-semibold underline hover:text-red-800"
                    >
                      Clear search filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedPartnerships.map((item, idx) => {
                const clearance = calculateClearancePercentage(item);
                const daysToExpiry = calculateDaysToExpiry(item.expiryDate);
                const renewalAlert = getRenewalAlert(daysToExpiry, item.renewalNoticeDays);

                return (
                  <tr
                    key={item.id}
                    id={`partnership-row-${item.id}`}
                    className={`hover:bg-amber-50/40 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                    }`}
                  >
                    {/* ID */}
                    <td className="py-3 px-3 font-mono font-bold text-red-900 border-r border-slate-200">
                      {item.id}
                    </td>

                    {/* Partner Name (BLUE text in original PDF indicating user input) */}
                    <td className="py-3 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      <div className="flex items-center justify-between group">
                        <span
                          onClick={() => onSelectPartnership(item)}
                          className="hover:text-[#701627] hover:underline cursor-pointer"
                        >
                          {item.partnerName}
                        </span>
                        {item.healthStatus && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              item.healthStatus === 'Green'
                                ? 'bg-emerald-500'
                                : item.healthStatus === 'Amber'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            title={`Health Status: ${item.healthStatus}`}
                          />
                        )}
                      </div>
                    </td>

                    {/* Partner Category (BLUE styled) */}
                    <td className="py-3 px-3 border-r border-slate-200">
                      <span className="text-blue-700 font-medium text-xs">
                        {item.category}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-3 px-3 border-r border-slate-200">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.entity === 'Banque Misr'
                            ? 'bg-red-50 text-[#701627] border border-red-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.entity}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="py-3 px-3 border-r border-slate-200 font-medium text-blue-700">
                      {item.owner}
                    </td>

                    {/* Scope / Purpose (Cream highlight style for priority field in original PDF) */}
                    <td className="py-3 px-3 border-r border-slate-200 bg-amber-50/30 max-w-xs">
                      {item.scope.length > 1 ? (
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                          {item.scope.slice(0, 2).map((s, i) => (
                            <li key={i} className="truncate">
                              {s}
                            </li>
                          ))}
                          {item.scope.length > 2 && (
                            <li className="text-[10px] text-amber-800 font-medium italic">
                              +{item.scope.length - 2} more items...
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-700 truncate">{item.scope[0] || 'TBD'}</p>
                      )}
                    </td>

                    {/* Document Type & Status */}
                    <td className="py-3 px-3 border-r border-slate-200">
                      <div className="font-medium text-slate-800 text-xs">{item.documentType}</div>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                            item.documentStatus === 'Cleared for Signature'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.documentStatus === 'Under Internal Review'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : item.documentStatus === 'Internal Draft'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {item.documentStatus}
                        </span>
                      </div>
                    </td>

                    {/* Partnership Stage Selector */}
                    <td className="py-3 px-3 border-r border-slate-200">
                      <div className="relative inline-block w-full">
                        <select
                          id={`stage-select-${item.id}`}
                          value={item.stage}
                          onChange={(e) => onUpdateStage(item.id, e.target.value as PartnershipStage)}
                          className={`w-full py-1 px-2 pr-6 rounded text-xs font-semibold appearance-none cursor-pointer border focus:outline-none focus:ring-1 focus:ring-[#701627] ${
                            item.stage === '4. Signature'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : item.stage === '3. Internal Approvals'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : item.stage === '2. Negotiation'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : item.stage === '1. Exploration'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          <option value="0. On Hold">0. On Hold</option>
                          <option value="1. Exploration">1. Exploration</option>
                          <option value="2. Negotiation">2. Negotiation</option>
                          <option value="3. Internal Approvals">3. Internal Approvals</option>
                          <option value="4. Signature">4. Signature</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>

                    {/* Priority Level Selector */}
                    <td className="py-3 px-3 border-r border-slate-200 text-center">
                      <select
                        id={`priority-select-${item.id}`}
                        value={item.priority}
                        onChange={(e) => onUpdatePriority(item.id, e.target.value as PriorityLevel)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer focus:outline-none ${
                          item.priority === 'High'
                            ? 'bg-red-100 text-[#701627] border-red-300'
                            : item.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </td>

                    {/* Data Validated Health Status Cell Selector */}
                    <td className="py-3 px-3 border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <select
                          id={`health-status-select-${item.id}`}
                          value={item.healthStatus || 'Green'}
                          onChange={(e) => onUpdateHealthStatus(item.id, e.target.value as HealthStatus)}
                          className={`px-2 py-1 rounded text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#701627] ${
                            (item.healthStatus || 'Green') === 'Green'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : (item.healthStatus || 'Green') === 'Amber'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : (item.healthStatus || 'Green') === 'Red'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                          title="Data Validated Cell: Choose allowed health status"
                        >
                          <option value="Green">● Green (On Track)</option>
                          <option value="Amber">▲ Amber (Attention)</option>
                          <option value="Red">■ Red (Blocked)</option>
                          <option value="Completed">✓ Completed</option>
                        </select>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Data Validation Passed" />
                      </div>
                    </td>

                    {/* Strategic Clearance % (Black formula result in PDF) */}
                    <td className="py-3 px-3 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full"
                            style={{ width: `${clearance}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {clearance}%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {Object.values(item.valueDrivers).filter(Boolean).length} of 5 drivers
                      </div>
                    </td>

                    {/* Expiry & Alert (Formula result) */}
                    <td className="py-3 px-3 border-r border-slate-200">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${renewalAlert.badgeColor}`}>
                        {renewalAlert.statusText}
                      </span>
                      {item.expiryDate && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Exp: {item.expiryDate}
                        </div>
                      )}
                    </td>

                    {/* Row Action Buttons */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          id={`btn-view-${item.id}`}
                          onClick={() => onSelectPartnership(item)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Partnership Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-edit-${item.id}`}
                          onClick={() => onEditPartnership(item)}
                          className="p-1 text-slate-500 hover:text-[#701627] hover:bg-red-50 rounded transition-colors"
                          title="Edit Partnership"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-${item.id}`}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${item.partnerName} (${item.id})?`)) {
                              onDeletePartnership(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer statistics bar */}
      <div className="p-3 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
        <div>
          Showing <span className="font-semibold text-slate-900">{sortedPartnerships.length}</span> rows
        </div>
        <div className="flex items-center gap-4">
          <span>High Priority: <strong className="text-[#701627]">{sortedPartnerships.filter(p => p.priority === 'High').length}</strong></span>
          <span>Cleared for Signature: <strong className="text-emerald-700">{sortedPartnerships.filter(p => p.documentStatus === 'Cleared for Signature').length}</strong></span>
        </div>
      </div>
    </div>
  );
};
