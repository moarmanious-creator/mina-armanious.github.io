import React from 'react';
import { X, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';

interface NotesAssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NOTES_LIST = [
  {
    num: 1,
    title: 'Source Data Provenance',
    text: 'Partner names, document types, and entities taken from the list supplied by Mina (03 Aug 2026).'
  },
  {
    num: 2,
    title: 'Split Instrument Handling',
    text: 'Allianz and Antler are each split across two rows because two distinct instruments are in play (Bancassurance contract vs. Allianz X MoU; LPA vs. side letter).'
  },
  {
    num: 3,
    title: 'Pipeline Stage Pre-population',
    text: 'Stages pre-populated from supplied descriptions (AUC & BCG = Exploration; Antler = Internal Approvals). All other fields left blank for business owners.'
  },
  {
    num: 4,
    title: 'Renewal Notice & Alert Formula',
    text: 'Renewal Alert defaults to a 90-day warning window where Renewal Notice (days) is blank.'
  },
  {
    num: 5,
    title: 'Priority Cell Styling',
    text: 'Cream-filled cells represent priority fields: Scope, Value, both SPOCs, Health.'
  },
  {
    num: 6,
    title: 'Original Baseline Records',
    text: 'Rows BMV-P01 to BMV-P14 are the original partnership records — no inputs were added to them.'
  },
  {
    num: 7,
    title: 'Migrated Pending Contracts',
    text: 'Rows PND-0001 to PND-0026 were migrated from Pending_Tracker_2.xlsx › Pending Contracts, keeping their original IDs. Mapping: Institution to Partner; Theme to Scope; Type to Document Type.'
  },
  {
    num: 8,
    title: 'Entity Assignment Rules',
    text: 'Entity was filled only where the source comment stated it (VMS, ECAS, Global 500 = MFI; TKH = Banque Misr). Partner Category, dates, value and SPOCs left blank rather than inferred.'
  },
  {
    num: 9,
    title: 'Stage Derivation Mapping',
    text: 'Stage was derived from Type and approval state: Explore/Meeting = Exploration; Prepare MOU = Negotiation; MOU/LPA with a department still pending = Internal Approvals; fully approved = Signature.'
  }
];

export const NotesAssumptionsModal: React.FC<NotesAssumptionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#701627] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="text-lg font-bold">Register Notes & Assumptions</h2>
              <p className="text-xs text-red-100 opacity-90">
                Official register baseline governance rules from original document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Excel Formula Rules:</strong> BLUE cells indicate user input values. BLACK cells indicate automatic formula calculations (Days to Expiry, Renewal Alert, Clearance %).
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {NOTES_LIST.map((note) => (
              <div key={note.num} className="py-3 flex items-start gap-3 text-xs">
                <span className="w-6 h-6 rounded-full bg-red-100 text-[#701627] font-bold flex items-center justify-center shrink-0 text-xs">
                  {note.num}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{note.title}</h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{note.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#701627] text-white text-xs font-bold rounded-lg hover:bg-red-900 transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
