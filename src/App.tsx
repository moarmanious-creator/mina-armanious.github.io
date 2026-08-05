import React, { useState, useEffect, useMemo } from 'react';
import { Partnership, FilterState, PartnershipStage, PriorityLevel, StrategicValueDrivers, HealthStatus } from './types/partnership';
import { INITIAL_PARTNERSHIPS, calculateClearancePercentage, calculateDaysToExpiry } from './data/initialPartnerships';
import { Header } from './components/Header';
import { KPISummary } from './components/KPISummary';
import { PartnershipTable } from './components/PartnershipTable';
import { PartnershipKanban } from './components/PartnershipKanban';
import { StrategicValueMatrix } from './components/StrategicValueMatrix';
import { AnalyticsView } from './components/AnalyticsView';
import { PartnershipModal } from './components/PartnershipModal';
import { NotesAssumptionsModal } from './components/NotesAssumptionsModal';
import { PartnershipDetailDrawer } from './components/PartnershipDetailDrawer';
import { ExportModal } from './components/ExportModal';
import { PublishModal } from './components/PublishModal';
import { exportToExcel, exportToPPTX, exportToPDF, exportToCSV } from './utils/exportUtils';
import { loadInitialPublishedState, publishPartnerships, CLIENT_SESSION_ID } from './utils/publishUtils';

const LOCAL_STORAGE_KEY = 'strategic_partnerships_register_data_v1';

export default function App() {
  const [publishedTimestamp, setPublishedTimestamp] = useState<string | null>(null);

  const [partnerships, setPartnerships] = useState<Partnership[]>(() => {
    // 1. Check published URL hash payload or published localStorage
    const publishedState = loadInitialPublishedState();
    if (publishedState.data) {
      return publishedState.data;
    }

    // 2. Check standard local storage key
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load from local storage:', e);
    }
    return INITIAL_PARTNERSHIPS;
  });

  const [activeTab, setActiveTab] = useState<'table' | 'kanban' | 'matrix' | 'analytics'>('table');

  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    category: '',
    entity: '',
    stage: '',
    documentStatus: '',
    priority: '',
    valueDriver: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<Partnership | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);

  // Save status & timestamp
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [isJustSaved, setIsJustSaved] = useState<boolean>(false);

  // Save helper
  const triggerSaveState = () => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSavedTime(timeStr);
    setIsJustSaved(true);
    setTimeout(() => setIsJustSaved(false), 2000);
  };

  const handleManualSave = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(partnerships));
      triggerSaveState();
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [partnerships]);

  // Filtered partnerships for exports and table sync
  const filteredPartnerships = useMemo(() => {
    return partnerships.filter((p) => {
      const searchLower = filterState.search.toLowerCase();
      const matchesSearch =
        !filterState.search ||
        p.partnerName.toLowerCase().includes(searchLower) ||
        p.id.toLowerCase().includes(searchLower) ||
        p.owner.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.scope.some((s) => s.toLowerCase().includes(searchLower));

      const matchesCategory = !filterState.category || p.category === filterState.category;
      const matchesEntity = !filterState.entity || p.entity === filterState.entity;
      const matchesStage = !filterState.stage || p.stage === filterState.stage;
      const matchesStatus = !filterState.documentStatus || p.documentStatus === filterState.documentStatus;
      const matchesPriority = !filterState.priority || p.priority === filterState.priority;
      const matchesHealthStatus = !filterState.healthStatus || p.healthStatus === filterState.healthStatus;

      const matchesAlert =
        filterState.valueDriver === 'RENEWAL_ALERT'
          ? (calculateDaysToExpiry(p.expiryDate) ?? 999) <= (p.renewalNoticeDays || 90)
          : filterState.valueDriver
          ? p.valueDrivers[filterState.valueDriver as keyof StrategicValueDrivers]
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

  // Initial load: honor a shared #published= link on open
  useEffect(() => {
    const publishedState = loadInitialPublishedState();
    if (publishedState.isFromUrl && publishedState.data) {
      setPartnerships(publishedState.data);
    }
  }, []);

  // Auto-save & broadcast changes to localStorage, URL hash, and other open tabs
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(partnerships));
      const pubResult = publishPartnerships(partnerships);
      if (pubResult.timestamp) {
        setPublishedTimestamp(pubResult.timestamp);
      }
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(timeStr);
      setIsJustSaved(true);
      const timer = setTimeout(() => setIsJustSaved(false), 2000);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Failed to auto-save and publish changes:', e);
    }
  }, [partnerships]);

  // Listen for BroadcastChannel events from other tabs of this browser (real-time sync)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('strategic_partnerships_live_sync');
        channel.onmessage = (event) => {
          if (
            event.data &&
            event.data.type === 'PUBLISHED_UPDATE' &&
            event.data.senderId !== CLIENT_SESSION_ID &&
            Array.isArray(event.data.partnerships)
          ) {
            setPartnerships(event.data.partnerships);
            setPublishedTimestamp(event.data.timestamp);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    // Also listen to hash changes if recipient navigates or loads via published link
    const handleHashChange = () => {
      const publishedState = loadInitialPublishedState();
      if (publishedState.data) {
        setPartnerships(publishedState.data);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Handlers
  const handleAddNew = () => {
    setEditingPartnership(null);
    setIsModalOpen(true);
  };

  const handleEdit = (partnership: Partnership) => {
    setEditingPartnership(partnership);
    setIsModalOpen(true);
  };

  const handleSavePartnership = (record: Partnership) => {
    setPartnerships((prev) => {
      const exists = prev.some((p) => p.id === record.id);
      if (exists) {
        return prev.map((p) => (p.id === record.id ? record : p));
      }
      return [record, ...prev];
    });

    if (selectedPartnership?.id === record.id) {
      setSelectedPartnership(record);
    }
  };

  const handleDeletePartnership = (id: string) => {
    setPartnerships((prev) => prev.filter((p) => p.id !== id));
    if (selectedPartnership?.id === id) {
      setSelectedPartnership(null);
    }
  };

  const handleUpdateStage = (id: string, stage: PartnershipStage) => {
    setPartnerships((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stage } : p))
    );
  };

  const handleUpdatePriority = (id: string, priority: PriorityLevel) => {
    setPartnerships((prev) =>
      prev.map((p) => (p.id === id ? { ...p, priority } : p))
    );
  };

  const handleUpdateHealthStatus = (id: string, healthStatus: HealthStatus) => {
    setPartnerships((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, healthStatus };
          if (selectedPartnership?.id === id) {
            setSelectedPartnership(updated);
          }
          return updated;
        }
        return p;
      })
    );
  };

  const handleToggleValueDriver = (id: string, driverKey: keyof StrategicValueDrivers) => {
    setPartnerships((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedDrivers = {
            ...p.valueDrivers,
            [driverKey]: !p.valueDrivers[driverKey],
          };
          return { ...p, valueDrivers: updatedDrivers };
        }
        return p;
      })
    );
  };

  const handleResetData = () => {
    if (window.confirm('Reset all register data back to initial baseline document (20 partnerships)?')) {
      setPartnerships(INITIAL_PARTNERSHIPS);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(filteredPartnerships.length > 0 ? filteredPartnerships : partnerships);
  };

  const handleExportPPTX = () => {
    exportToPPTX(filteredPartnerships.length > 0 ? filteredPartnerships : partnerships);
  };

  const handleExportPDF = () => {
    exportToPDF(filteredPartnerships.length > 0 ? filteredPartnerships : partnerships);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredPartnerships.length > 0 ? filteredPartnerships : partnerships);
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased selection:bg-amber-200 selection:text-amber-900">
      {/* Top Header */}
      <Header
        onAddNew={handleAddNew}
        onOpenNotes={() => setIsNotesOpen(true)}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
        publishedTimestamp={publishedTimestamp}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onExportExcel={handleExportExcel}
        onExportPPTX={handleExportPPTX}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        onResetData={handleResetData}
        onManualSave={handleManualSave}
        lastSavedTime={lastSavedTime}
        isJustSaved={isJustSaved}
        totalRecords={partnerships.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top KPI Metrics Bar */}
        <KPISummary
          partnerships={partnerships}
          onFilterByStage={(stage) => {
            setActiveTab('table');
            setFilterState((prev) => ({ ...prev, stage }));
          }}
          onFilterByAlert={() => {
            setActiveTab('table');
            setFilterState((prev) => ({ ...prev, valueDriver: 'RENEWAL_ALERT' }));
          }}
        />

        {/* Tab View Contents */}
        {activeTab === 'table' && (
          <PartnershipTable
            partnerships={partnerships}
            onSelectPartnership={(p) => setSelectedPartnership(p)}
            onEditPartnership={handleEdit}
            onDeletePartnership={handleDeletePartnership}
            onUpdateStage={handleUpdateStage}
            onUpdatePriority={handleUpdatePriority}
            onUpdateHealthStatus={handleUpdateHealthStatus}
            filterState={filterState}
            setFilterState={setFilterState}
          />
        )}

        {activeTab === 'kanban' && (
          <PartnershipKanban
            partnerships={partnerships}
            onUpdateStage={handleUpdateStage}
            onSelectPartnership={(p) => setSelectedPartnership(p)}
            onEditPartnership={handleEdit}
          />
        )}

        {activeTab === 'matrix' && (
          <StrategicValueMatrix
            partnerships={partnerships}
            onToggleValueDriver={handleToggleValueDriver}
            onSelectPartnership={(p) => setSelectedPartnership(p)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView partnerships={partnerships} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>STRATEGIC PARTNERSHIPS REGISTER</strong> • Single Source of Truth
          </div>
          <div className="text-[11px] text-slate-400">
            Baseline Refresh: 05 Aug 2026 • 20 Initial Partner Records
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <PartnershipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePartnership}
        partnershipToEdit={editingPartnership}
        existingIds={partnerships.map((p) => p.id)}
      />

      <NotesAssumptionsModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
      />

      <PartnershipDetailDrawer
        partnership={selectedPartnership}
        onClose={() => setSelectedPartnership(null)}
        onEdit={(p) => {
          setSelectedPartnership(null);
          handleEdit(p);
        }}
        onUpdateHealthStatus={handleUpdateHealthStatus}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        partnerships={partnerships}
        filteredPartnerships={filteredPartnerships}
        hasActiveFilters={
          Boolean(
            filterState.search ||
            filterState.category ||
            filterState.entity ||
            filterState.stage ||
            filterState.documentStatus ||
            filterState.priority ||
            filterState.healthStatus ||
            filterState.valueDriver
          )
        }
      />

      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        partnerships={partnerships}
        publishedTimestamp={publishedTimestamp}
        onPublishedSuccess={(ts) => setPublishedTimestamp(ts)}
      />
    </div>
  );
}
