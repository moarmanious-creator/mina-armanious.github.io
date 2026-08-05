import React from 'react';
import { Partnership, PartnershipStage } from '../types/partnership';
import { calculateClearancePercentage } from '../data/initialPartnerships';
import { Flame, ArrowRight, Eye, Edit2, MoveRight, CheckCircle2 } from 'lucide-react';

interface PartnershipKanbanProps {
  partnerships: Partnership[];
  onUpdateStage: (id: string, stage: PartnershipStage) => void;
  onSelectPartnership: (partnership: Partnership) => void;
  onEditPartnership: (partnership: Partnership) => void;
}

const STAGES: { stage: PartnershipStage; label: string; color: string; badge: string }[] = [
  { stage: '1. Exploration', label: '1. Exploration', color: 'bg-blue-50/70 border-blue-200', badge: 'bg-blue-600 text-white' },
  { stage: '2. Negotiation', label: '2. Negotiation', color: 'bg-purple-50/70 border-purple-200', badge: 'bg-purple-600 text-white' },
  { stage: '3. Internal Approvals', label: '3. Internal Approvals', color: 'bg-indigo-50/70 border-indigo-200', badge: 'bg-indigo-600 text-white' },
  { stage: '4. Signature', label: '4. Signature / Active', color: 'bg-emerald-50/70 border-emerald-200', badge: 'bg-emerald-600 text-white' },
  { stage: '0. On Hold', label: '0. On Hold', color: 'bg-slate-100/80 border-slate-300', badge: 'bg-slate-600 text-white' },
];

export const PartnershipKanban: React.FC<PartnershipKanbanProps> = ({
  partnerships,
  onUpdateStage,
  onSelectPartnership,
  onEditPartnership,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: PartnershipStage) => {
    e.preventDefault();
    const partnershipId = e.dataTransfer.getData('text/plain');
    if (partnershipId) {
      onUpdateStage(partnershipId, targetStage);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  return (
    <div id="pipeline-kanban-board" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
      {STAGES.map(({ stage, label, color, badge }) => {
        const stagePartnerships = partnerships.filter((p) => p.stage === stage);

        return (
          <div
            key={stage}
            id={`kanban-col-${stage.replace(/[^a-z0-9]/gi, '-')}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
            className={`rounded-xl border p-3 flex flex-col gap-3 min-h-[520px] ${color}`}
          >
            {/* Stage Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <h3 className="font-bold text-xs sm:text-sm text-slate-800 truncate">{label}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge}`}>
                {stagePartnerships.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[700px] pr-1">
              {stagePartnerships.length === 0 ? (
                <div className="h-28 border-2 border-dashed border-slate-300/70 rounded-lg flex items-center justify-center text-slate-400 text-xs italic">
                  Drop cards here
                </div>
              ) : (
                stagePartnerships.map((item) => {
                  const clearance = calculateClearancePercentage(item);
                  return (
                    <div
                      key={item.id}
                      id={`kanban-card-${item.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      className="bg-white rounded-lg p-3.5 shadow-xs border border-slate-200/90 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
                    >
                      {/* Top ID & Priority Header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[11px] font-bold text-red-900 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                          {item.id}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {item.healthStatus && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                item.healthStatus === 'Green'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.healthStatus === 'Amber'
                                  ? 'bg-amber-100 text-amber-800'
                                  : item.healthStatus === 'Red'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {item.healthStatus}
                            </span>
                          )}
                          {item.priority === 'High' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                              <Flame className="w-3 h-3 text-red-500 fill-red-500" /> High
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {item.entity}
                          </span>
                        </div>
                      </div>

                      {/* Partner Name */}
                      <h4
                        onClick={() => onSelectPartnership(item)}
                        className="font-bold text-slate-900 text-sm hover:text-[#701627] hover:underline cursor-pointer leading-snug"
                      >
                        {item.partnerName}
                      </h4>

                      {/* Partner Category */}
                      <p className="text-[11px] font-medium text-blue-700 mt-0.5">
                        {item.category}
                      </p>

                      {/* Scope Snippet */}
                      <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-1.5 rounded border border-slate-100 line-clamp-2">
                        {item.scope[0] || 'No scope specified'}
                      </p>

                      {/* Document Status */}
                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            item.documentStatus === 'Cleared for Signature'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.documentStatus === 'Under Internal Review'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.documentStatus}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-700">
                          {clearance}% Clearance
                        </span>
                      </div>

                      {/* Quick stage mover controls */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onSelectPartnership(item)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Details
                        </button>

                        <div className="flex items-center gap-1">
                          {stage !== '4. Signature' && (
                            <button
                              onClick={() => {
                                const nextStageMap: Record<string, PartnershipStage> = {
                                  '0. On Hold': '1. Exploration',
                                  '1. Exploration': '2. Negotiation',
                                  '2. Negotiation': '3. Internal Approvals',
                                  '3. Internal Approvals': '4. Signature',
                                };
                                if (nextStageMap[stage]) {
                                  onUpdateStage(item.id, nextStageMap[stage]);
                                }
                              }}
                              className="px-2 py-0.5 bg-[#701627] text-white text-[10px] font-semibold rounded hover:bg-red-900 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Advance Stage"
                            >
                              <span>Advance</span>
                              <MoveRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
