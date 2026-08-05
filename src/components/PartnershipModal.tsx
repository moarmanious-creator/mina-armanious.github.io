import React, { useState, useEffect } from 'react';
import { Partnership, PartnershipStage, PriorityLevel, DocumentType, DocumentStatus, EntityType, PartnerCategory, StrategicValueDrivers, HealthStatus } from '../types/partnership';
import { X, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface PartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partnership: Partnership) => void;
  partnershipToEdit?: Partnership | null;
  existingIds: string[];
}

const CATEGORIES: PartnerCategory[] = [
  'Corporate Venture / Innovation',
  'Cloud / Technology',
  'Insurance / Bancassurance',
  'Venture Capital / Fund',
  'Startup Ecosystem',
  'DFI / Multilateral',
  'Academic / Research',
  'Legal Advisory',
  'Consulting / Advisory',
];

export const PartnershipModal: React.FC<PartnershipModalProps> = ({
  isOpen,
  onClose,
  onSave,
  partnershipToEdit,
  existingIds,
}) => {
  const isEdit = !!partnershipToEdit;

  const [id, setId] = useState<string>('');
  const [partnerName, setPartnerName] = useState<string>('');
  const [category, setCategory] = useState<PartnerCategory>('Corporate Venture / Innovation');
  const [entity, setEntity] = useState<EntityType>('Banque Misr');
  const [owner, setOwner] = useState<string>('ISV');
  const [scopeInputs, setScopeInputs] = useState<string[]>(['']);
  const [documentType, setDocumentType] = useState<DocumentType>('MoU');
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('Under Internal Review');
  const [stage, setStage] = useState<PartnershipStage>('1. Exploration');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [valueDrivers, setValueDrivers] = useState<StrategicValueDrivers>({
    growthEngine: false,
    ventureClienting: false,
    startupFriendlyBank: false,
    ecosystemEngagement: false,
    investment: false,
  });
  const [targetSignatureDate, setTargetSignatureDate] = useState<string>('2026-11-30');
  const [expiryDate, setExpiryDate] = useState<string>('2027-11-30');
  const [renewalNoticeDays, setRenewalNoticeDays] = useState<number>(90);
  const [internalSPOC, setInternalSPOC] = useState<string>('');
  const [partnerSPOC, setPartnerSPOC] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('Green');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (partnershipToEdit) {
      setId(partnershipToEdit.id);
      setPartnerName(partnershipToEdit.partnerName);
      setCategory(partnershipToEdit.category);
      setEntity(partnershipToEdit.entity);
      setOwner(partnershipToEdit.owner || 'ISV');
      setScopeInputs(partnershipToEdit.scope.length > 0 ? partnershipToEdit.scope : ['']);
      setDocumentType(partnershipToEdit.documentType);
      setDocumentStatus(partnershipToEdit.documentStatus);
      setStage(partnershipToEdit.stage);
      setPriority(partnershipToEdit.priority);
      setValueDrivers(partnershipToEdit.valueDrivers);
      setTargetSignatureDate(partnershipToEdit.targetSignatureDate || '');
      setExpiryDate(partnershipToEdit.expiryDate || '');
      setRenewalNoticeDays(partnershipToEdit.renewalNoticeDays || 90);
      setInternalSPOC(partnershipToEdit.internalSPOC || '');
      setPartnerSPOC(partnershipToEdit.partnerSPOC || '');
      setHealthStatus(partnershipToEdit.healthStatus || 'Green');
      setNotes(partnershipToEdit.notes || '');
    } else {
      // Auto-generate next ID
      const nextNum = existingIds.length + 1;
      const formattedId = `BMV-P${nextNum < 10 ? '0' + nextNum : nextNum}`;
      setId(formattedId);
      setPartnerName('');
      setCategory('Corporate Venture / Innovation');
      setEntity('Banque Misr');
      setOwner('ISV');
      setScopeInputs(['']);
      setDocumentType('MoU');
      setDocumentStatus('Under Internal Review');
      setStage('1. Exploration');
      setPriority('High');
      setValueDrivers({
        growthEngine: true,
        ventureClienting: false,
        startupFriendlyBank: false,
        ecosystemEngagement: true,
        investment: false,
      });
      setTargetSignatureDate('2026-12-31');
      setExpiryDate('2027-12-31');
      setRenewalNoticeDays(90);
      setInternalSPOC('Mina Armanious');
      setPartnerSPOC('');
      setHealthStatus('Green');
      setNotes('');
    }
  }, [partnershipToEdit, isOpen]);

  if (!isOpen) return null;

  const handleScopeChange = (index: number, val: string) => {
    const updated = [...scopeInputs];
    updated[index] = val;
    setScopeInputs(updated);
  };

  const addScopePoint = () => {
    setScopeInputs([...scopeInputs, '']);
  };

  const removeScopePoint = (index: number) => {
    if (scopeInputs.length <= 1) return;
    setScopeInputs(scopeInputs.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) {
      alert('Please provide a partner name.');
      return;
    }

    const cleanScopes = scopeInputs.map((s) => s.trim()).filter(Boolean);

    const record: Partnership = {
      id: id.trim() || 'BMV-P99',
      partnerName: partnerName.trim(),
      category,
      entity,
      owner: owner.trim() || 'ISV',
      scope: cleanScopes.length > 0 ? cleanScopes : ['Ecosystem Engagement'],
      documentType,
      documentStatus,
      stage,
      priority,
      valueDrivers,
      targetSignatureDate,
      expiryDate,
      renewalNoticeDays,
      internalSPOC,
      partnerSPOC,
      healthStatus,
      notes,
      isUserFilled: true,
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#701627] text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {isEdit ? `Edit Partnership (${id})` : 'Create New Strategic Partnership'}
            </h2>
            <p className="text-xs text-red-100 opacity-90">
              Update partner details, document stage, and strategic driver checkboxes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Row 1: ID, Partner Name, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unique ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={isEdit}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-red-900 focus:outline-none focus:ring-1 focus:ring-[#701627]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Partner / Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., SC Ventures, Microsoft, Allianz..."
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#701627]"
              />
            </div>
          </div>

          {/* Row 2: Category, Entity, Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Partner Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PartnerCategory)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Entity</label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value as EntityType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
              >
                <option value="Banque Misr">Banque Misr</option>
                <option value="MFI">MFI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Owner / Responsible</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Row 3: Stage, Priority, Health Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Partnership Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as PartnershipStage)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
              >
                <option value="0. On Hold">0. On Hold</option>
                <option value="1. Exploration">1. Exploration</option>
                <option value="2. Negotiation">2. Negotiation</option>
                <option value="3. Internal Approvals">3. Internal Approvals</option>
                <option value="4. Signature">4. Signature</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Health Status (Data Validated)</span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Validated
                </span>
              </label>
              <select
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value as HealthStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-[#701627]"
              >
                <option value="Green">Green (On Track)</option>
                <option value="Amber">Amber (Attention Needed)</option>
                <option value="Red">Red (Blocked / Delayed)</option>
                <option value="Completed">Completed (Signed & Delivered)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Document Type & Document Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
              >
                <option value="MoU">MoU</option>
                <option value="Bancassurance Agreement">Bancassurance Agreement</option>
                <option value="Limited Partnership Agreement">Limited Partnership Agreement</option>
                <option value="Engagement Letter">Engagement Letter</option>
                <option value="None (Exploration)">None (Exploration)</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Status</label>
              <select
                value={documentStatus}
                onChange={(e) => setDocumentStatus(e.target.value as DocumentStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
              >
                <option value="Under Internal Review">Under Internal Review</option>
                <option value="Internal Draft">Internal Draft</option>
                <option value="Cleared for Signature">Cleared for Signature</option>
                <option value="Not Drafted">Not Drafted</option>
                <option value="Signed & Active">Signed & Active</option>
              </select>
            </div>
          </div>

          {/* Row 5: Strategic Value Drivers (Checkboxes) */}
          <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-200">
            <label className="block text-xs font-bold text-amber-900 mb-2">
              Strategic Value Drivers (Calculates Clearance %)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:bg-amber-100/50">
                <input
                  type="checkbox"
                  checked={valueDrivers.growthEngine}
                  onChange={(e) => setValueDrivers({ ...valueDrivers, growthEngine: e.target.checked })}
                  className="rounded text-[#701627] focus:ring-[#701627]"
                />
                <span className="font-semibold text-slate-800">Growth & Value Creation Engine</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:bg-amber-100/50">
                <input
                  type="checkbox"
                  checked={valueDrivers.ventureClienting}
                  onChange={(e) => setValueDrivers({ ...valueDrivers, ventureClienting: e.target.checked })}
                  className="rounded text-[#701627] focus:ring-[#701627]"
                />
                <span className="font-semibold text-slate-800">Next Growth - Venture Clienting</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:bg-amber-100/50">
                <input
                  type="checkbox"
                  checked={valueDrivers.startupFriendlyBank}
                  onChange={(e) => setValueDrivers({ ...valueDrivers, startupFriendlyBank: e.target.checked })}
                  className="rounded text-[#701627] focus:ring-[#701627]"
                />
                <span className="font-semibold text-slate-800">Next Growth - Start Up friendly Bank</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:bg-amber-100/50">
                <input
                  type="checkbox"
                  checked={valueDrivers.ecosystemEngagement}
                  onChange={(e) => setValueDrivers({ ...valueDrivers, ecosystemEngagement: e.target.checked })}
                  className="rounded text-[#701627] focus:ring-[#701627]"
                />
                <span className="font-semibold text-slate-800">Ecosystem Engagement</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:bg-amber-100/50 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={valueDrivers.investment}
                  onChange={(e) => setValueDrivers({ ...valueDrivers, investment: e.target.checked })}
                  className="rounded text-[#701627] focus:ring-[#701627]"
                />
                <span className="font-semibold text-slate-800">Investment (Fund / LP / Equity)</span>
              </label>
            </div>
          </div>

          {/* Scope Points */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Scope & Purpose Points</label>
              <button
                type="button"
                onClick={addScopePoint}
                className="text-xs text-[#701627] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Scope Line
              </button>
            </div>
            <div className="space-y-2">
              {scopeInputs.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Venture-building methodology"
                    value={val}
                    onChange={(e) => handleScopeChange(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                  {scopeInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScopePoint(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dates & Renewal Notice */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Signature Date</label>
              <input
                type="date"
                value={targetSignatureDate}
                onChange={(e) => setTargetSignatureDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contract Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Renewal Notice (Days)</label>
              <input
                type="number"
                value={renewalNoticeDays}
                onChange={(e) => setRenewalNoticeDays(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          {/* SPOCs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Internal SPOC</label>
              <input
                type="text"
                placeholder="Internal Single Point of Contact"
                value={internalSPOC}
                onChange={(e) => setInternalSPOC(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Partner SPOC</label>
              <input
                type="text"
                placeholder="Partner Contact Name & Role"
                value={partnerSPOC}
                onChange={(e) => setPartnerSPOC(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Next Actions</label>
            <textarea
              rows={3}
              placeholder="Add key assumptions, risk notes, or next action items..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#701627] hover:bg-red-900 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Save Changes' : 'Create Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
