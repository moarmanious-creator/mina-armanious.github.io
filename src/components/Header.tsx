import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  FileSpreadsheet,
  Info,
  Download,
  RefreshCw,
  Layers,
  ChevronDown,
  Presentation,
  FileText,
  Sparkles,
  FileCode,
  Save,
  Check,
  CheckCircle2,
  Globe,
  Share2,
} from 'lucide-react';

interface HeaderProps {
  onAddNew: () => void;
  onOpenNotes: () => void;
  onOpenPublishModal: () => void;
  publishedTimestamp: string | null;
  onOpenExportModal: () => void;
  onExportExcel: () => void;
  onExportPPTX: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  onManualSave: () => void;
  lastSavedTime: string;
  isJustSaved: boolean;
  totalRecords: number;
  activeTab: 'table' | 'kanban' | 'matrix' | 'analytics';
  setActiveTab: (tab: 'table' | 'kanban' | 'matrix' | 'analytics') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onAddNew,
  onOpenNotes,
  onOpenPublishModal,
  publishedTimestamp,
  onOpenExportModal,
  onExportExcel,
  onExportPPTX,
  onExportPDF,
  onExportCSV,
  onResetData,
  onManualSave,
  lastSavedTime,
  isJustSaved,
  totalRecords,
  activeTab,
  setActiveTab,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header id="main-header" className="bg-[#701627] text-white shadow-lg border-b border-[#54101d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Main Title & Subtitle */}
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-white/10 rounded-lg text-amber-300 backdrop-blur-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  STRATEGIC PARTNERSHIPS <span className="text-amber-400 font-light">•</span> REGISTER
                </h1>
                <p className="text-xs sm:text-sm text-red-100 font-normal opacity-90">
                  Single source of truth for every partnership, MoU, contract and engagement letter
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-red-200">
              <span className="bg-white/15 px-2.5 py-0.5 rounded-full font-mono text-[11px] text-amber-200">
                Last Refreshed: 05 Aug 2026
              </span>
              <span className="hidden sm:inline opacity-40">•</span>
              <span className="inline-flex items-center gap-1 text-emerald-200 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {totalRecords} Active Records
              </span>
              <span className="hidden sm:inline opacity-40">•</span>
              <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-400/30 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved {lastSavedTime ? `at ${lastSavedTime}` : '& Synced'}</span>
              </span>
              <span className="hidden md:inline opacity-40">•</span>
              <span className="hidden md:inline text-amber-100/80 italic">
                BLUE = editable • BLACK = auto formulas
              </span>
            </div>
          </div>

          {/* Actions & Tab Switcher */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Save Button */}
            <button
              id="btn-save-changes"
              onClick={onManualSave}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95 ${
                isJustSaved
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40'
              }`}
              title="Save all changes to storage (Ctrl + S)"
            >
              {isJustSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-100 animate-bounce" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-emerald-100" />
                  <span>Save</span>
                </>
              )}
            </button>

            {/* Publish Live Link Button */}
            <button
              id="btn-publish-live"
              onClick={onOpenPublishModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer border border-teal-300/40 active:scale-95"
              title="Publish live changes & generate share link for anyone"
            >
              <Globe className="w-4 h-4 text-emerald-100 animate-pulse" />
              <span>Publish Live</span>
            </button>

            <button
              id="btn-add-partnership"
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#701627] font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Record</span>
            </button>

            <button
              id="btn-open-assumptions"
              onClick={onOpenNotes}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition-all cursor-pointer"
              title="Notes & Assumptions"
            >
              <Info className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Notes & Rules</span>
            </button>

            {/* Export Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="btn-export-dropdown"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs border border-white/20"
                title="Export Options (PowerPoint, Excel, PDF, CSV)"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>Export</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-fade-in text-slate-800">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Export Format Options
                  </div>

                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportPPTX();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-amber-50 flex items-center gap-2.5 text-xs font-semibold text-slate-700 hover:text-amber-900 transition-colors cursor-pointer"
                  >
                    <Presentation className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="flex flex-col">
                      <span>PowerPoint Deck (.pptx)</span>
                      <span className="text-[10px] font-normal text-slate-500">16:9 Executive slide deck</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportExcel();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center gap-2.5 text-xs font-semibold text-slate-700 hover:text-emerald-900 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex flex-col">
                      <span>Excel Workbook (.xlsx)</span>
                      <span className="text-[10px] font-normal text-slate-500">Multi-sheet styled register</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportPDF();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 flex items-center gap-2.5 text-xs font-semibold text-slate-700 hover:text-[#701627] transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#701627] shrink-0" />
                    <div className="flex flex-col">
                      <span>PDF Document (.pdf)</span>
                      <span className="text-[10px] font-normal text-slate-500">Printable Executive report</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportCSV();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-600 shrink-0" />
                    <div className="flex flex-col">
                      <span>CSV File (.csv)</span>
                      <span className="text-[10px] font-normal text-slate-500">Raw data spreadsheet</span>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onOpenExportModal();
                    }}
                    className="w-full text-left px-3.5 py-2 bg-slate-50 hover:bg-[#701627] hover:text-white flex items-center justify-between text-xs font-bold text-[#701627] transition-colors cursor-pointer rounded-b-lg"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Advanced Export Center...
                    </span>
                  </button>
                </div>
              )}
            </div>

            <button
              id="btn-reset-data"
              onClick={onResetData}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-red-200 hover:text-white transition-all cursor-pointer"
              title="Reset sample data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-5 flex items-center border-t border-white/15 pt-3 gap-1 overflow-x-auto no-scrollbar">
          <button
            id="tab-table-view"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'table'
                ? 'bg-white text-[#701627] shadow-sm font-semibold'
                : 'text-red-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Register Table
          </button>

          <button
            id="tab-kanban-view"
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'kanban'
                ? 'bg-white text-[#701627] shadow-sm font-semibold'
                : 'text-red-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Pipeline Kanban
          </button>

          <button
            id="tab-matrix-view"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white text-[#701627] shadow-sm font-semibold'
                : 'text-red-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="w-4 h-4 font-mono font-bold flex items-center justify-center border border-current rounded text-[10px]">✓</span>
            Strategic Value Matrix
          </button>

          <button
            id="tab-analytics-view"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-[#701627] shadow-sm font-semibold'
                : 'text-red-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="w-4 h-4 flex items-center justify-center font-bold">📊</span>
            Analytics & Insights
          </button>
        </div>
      </div>
    </header>
  );
};
