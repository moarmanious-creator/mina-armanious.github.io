import React, { useState } from 'react';
import { Partnership } from '../types/partnership';
import {
  exportToExcel,
  exportToPPTX,
  exportToPDF,
  exportToCSV,
} from '../utils/exportUtils';
import {
  X,
  FileSpreadsheet,
  FileText,
  Download,
  Presentation,
  Check,
  CheckCircle2,
  Sparkles,
  Layers,
  Info,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerships: Partnership[];
  filteredPartnerships: Partnership[];
  hasActiveFilters: boolean;
}

export type ExportFormat = 'xlsx' | 'pptx' | 'pdf' | 'csv';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  partnerships,
  filteredPartnerships,
  hasActiveFilters,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('xlsx');
  const [useFilteredData, setUseFilteredData] = useState<boolean>(hasActiveFilters);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetData = useFilteredData ? filteredPartnerships : partnerships;

  const handleRunExport = async (formatOverride?: ExportFormat) => {
    const fmt = formatOverride || selectedFormat;
    setIsExporting(true);
    setExportSuccess(null);

    try {
      // Simulate short delay for UX polish
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (fmt === 'xlsx') {
        exportToExcel(targetData);
        setExportSuccess('Excel Workbook (.xlsx) generated successfully!');
      } else if (fmt === 'pptx') {
        exportToPPTX(targetData);
        setExportSuccess('PowerPoint Deck (.pptx) generated successfully!');
      } else if (fmt === 'pdf') {
        exportToPDF(targetData);
        setExportSuccess('PDF Executive Report (.pdf) generated successfully!');
      } else if (fmt === 'csv') {
        exportToCSV(targetData);
        setExportSuccess('CSV Register File (.csv) downloaded!');
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#701627] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-xl text-amber-300">
              <Download className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Export Strategic Register</h2>
              <p className="text-xs text-red-100 opacity-90">
                Generate executive slide decks, Excel sheets, PDF reports & CSV datasets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Data Scope Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#701627]" />
              Select Data Subset for Export
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUseFilteredData(true)}
                disabled={!hasActiveFilters}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  useFilteredData
                    ? 'border-[#701627] bg-white ring-2 ring-[#701627]/20 shadow-xs'
                    : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-white'
                } ${!hasActiveFilters ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Current Filtered View</span>
                  {useFilteredData && <Check className="w-4 h-4 text-[#701627]" />}
                </div>
                <p className="text-xs text-slate-500">
                  {filteredPartnerships.length} partnerships matching active search/filters
                </p>
              </button>

              <button
                type="button"
                onClick={() => setUseFilteredData(false)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  !useFilteredData
                    ? 'border-[#701627] bg-white ring-2 ring-[#701627]/20 shadow-xs'
                    : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">All Register Records</span>
                  {!useFilteredData && <Check className="w-4 h-4 text-[#701627]" />}
                </div>
                <p className="text-xs text-slate-500">
                  Full dataset ({partnerships.length} total active partnerships)
                </p>
              </button>
            </div>
          </div>

          {/* Export Format Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Choose Export Format
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* PPTX Option */}
              <div
                onClick={() => setSelectedFormat('pptx')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'pptx'
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                    <Presentation className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">PowerPoint Deck (.pptx)</h3>
                      {selectedFormat === 'pptx' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      16:9 Executive slide deck with title slide, KPI metric cards, health status risk profile, and portfolio table.
                    </p>
                  </div>
                </div>
              </div>

              {/* Excel Option */}
              <div
                onClick={() => setSelectedFormat('xlsx')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'xlsx'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">Excel Workbook (.xlsx)</h3>
                      {selectedFormat === 'xlsx' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Multi-sheet formatted spreadsheet with Partnership Register tab and Executive Summary KPI tab.
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF Option */}
              <div
                onClick={() => setSelectedFormat('pdf')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'pdf'
                    ? 'border-[#701627] bg-red-50/40 ring-2 ring-[#701627]/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-red-100 text-[#701627] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">PDF Report (.pdf)</h3>
                      {selectedFormat === 'pdf' && <Check className="w-4 h-4 text-[#701627]" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Print-ready executive report with header branding, KPI summary banner, and color-coded data grid.
                    </p>
                  </div>
                </div>
              </div>

              {/* CSV Option */}
              <div
                onClick={() => setSelectedFormat('csv')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'csv'
                    ? 'border-slate-700 bg-slate-100/60 ring-2 ring-slate-700/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-200 text-slate-800 shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">CSV Dataset (.csv)</h3>
                      {selectedFormat === 'csv' && <Check className="w-4 h-4 text-slate-700" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Raw comma-separated dataset with all fields for analytics import or custom integration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Alert Toast */}
          {exportSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{exportSuccess}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Exporting {targetData.length} partnership records</span>
          </div>

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
              disabled={isExporting}
              onClick={() => handleRunExport()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#701627] hover:bg-[#57101e] text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Generating {selectedFormat.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Download {selectedFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
