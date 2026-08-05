import React, { useState } from 'react';
import { Partnership, StrategicValueDrivers } from '../types/partnership';
import { calculateClearancePercentage } from '../data/initialPartnerships';
import { CheckSquare, Square, ShieldCheck, Sparkles, Filter, Info } from 'lucide-react';

interface StrategicValueMatrixProps {
  partnerships: Partnership[];
  onToggleValueDriver: (id: string, driverKey: keyof StrategicValueDrivers) => void;
  onSelectPartnership: (partnership: Partnership) => void;
}

const VALUE_DRIVER_META: { key: keyof StrategicValueDrivers; label: string; description: string; color: string }[] = [
  {
    key: 'growthEngine',
    label: 'Growth & Value Creation Engine',
    description: 'Core revenue, commercial products, co-building frameworks',
    color: 'bg-red-50 text-red-900 border-red-200'
  },
  {
    key: 'ventureClienting',
    label: 'Next Horizon - Venture Clienting',
    description: 'Procuring technology solutions from portfolio startups',
    color: 'bg-blue-50 text-blue-900 border-blue-200'
  },
  {
    key: 'startupFriendlyBank',
    label: 'Next Horizon - Start Up friendly Bank',
    description: 'Tailored banking packages, API integrations, startup labels',
    color: 'bg-purple-50 text-purple-900 border-purple-200'
  },
  {
    key: 'ecosystemEngagement',
    label: 'Ecosystem Engagement',
    description: 'Hackathons, roundtables, accelerators, ecosystem presence',
    color: 'bg-amber-50 text-amber-900 border-amber-200'
  },
  {
    key: 'investment',
    label: 'Investment',
    description: 'LP fund commitments, direct co-investments, venture capital',
    color: 'bg-emerald-50 text-emerald-900 border-emerald-200'
  }
];

export const StrategicValueMatrix: React.FC<StrategicValueMatrixProps> = ({
  partnerships,
  onToggleValueDriver,
  onSelectPartnership,
}) => {
  const [filterDriver, setFilterDriver] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate stats for each driver
  const total = partnerships.length;
  const driverStats = VALUE_DRIVER_META.map((meta) => {
    const count = partnerships.filter((p) => p.valueDrivers[meta.key]).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return { ...meta, count, percentage };
  });

  const filteredPartnerships = partnerships.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDriver =
      filterDriver === 'ALL' ||
      p.valueDrivers[filterDriver as keyof StrategicValueDrivers];

    return matchesSearch && matchesDriver;
  });

  return (
    <div id="strategic-value-matrix-container" className="space-y-6">
      {/* Top Driver Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {driverStats.map((stat) => (
          <div
            key={stat.key}
            onClick={() => setFilterDriver(filterDriver === stat.key ? 'ALL' : stat.key)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              filterDriver === stat.key
                ? 'bg-[#701627] text-white border-[#701627] shadow-md'
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="truncate">{stat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  filterDriver === stat.key ? 'bg-amber-400 text-[#701627]' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {stat.percentage}%
              </span>
            </div>
            <div className="text-xl font-bold mt-1">
              {stat.count} <span className="text-xs font-normal opacity-70">partners</span>
            </div>
            <p className={`text-[10px] mt-1.5 line-clamp-2 ${filterDriver === stat.key ? 'text-red-100' : 'text-slate-500'}`}>
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#701627]" />
              Strategic Driver Alignment Grid
            </h3>
            <p className="text-xs text-slate-500">
              Interactive checkboxes match cream-filled priority cells in original register.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#701627]"
            />

            {filterDriver !== 'ALL' && (
              <button
                onClick={() => setFilterDriver('ALL')}
                className="text-xs text-[#701627] font-semibold underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#701627] text-white font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 border-r border-[#8c2438] w-24">ID</th>
                <th className="py-3 px-3 border-r border-[#8c2438] min-w-[160px]">Partner</th>
                <th className="py-3 px-3 border-r border-[#8c2438] text-center w-36">Growth Engine</th>
                <th className="py-3 px-3 border-r border-[#8c2438] text-center w-36">Venture Clienting</th>
                <th className="py-3 px-3 border-r border-[#8c2438] text-center w-36">Startup Friendly Bank</th>
                <th className="py-3 px-3 border-r border-[#8c2438] text-center w-36">Ecosystem Engagement</th>
                <th className="py-3 px-3 border-r border-[#8c2438] text-center w-36">Investment</th>
                <th className="py-3 px-3 text-center w-28">Clearance %</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredPartnerships.map((p, idx) => {
                const clearance = calculateClearancePercentage(p);

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-amber-50/40 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-red-900 border-r border-slate-200">
                      {p.id}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      <span
                        onClick={() => onSelectPartnership(p)}
                        className="hover:text-[#701627] hover:underline cursor-pointer"
                      >
                        {p.partnerName}
                      </span>
                      <div className="text-[10px] text-slate-500 font-normal">{p.category}</div>
                    </td>

                    {/* Checkboxes for 5 value drivers */}
                    {VALUE_DRIVER_META.map((meta) => {
                      const isChecked = p.valueDrivers[meta.key];
                      return (
                        <td
                          key={meta.key}
                          onClick={() => onToggleValueDriver(p.id, meta.key)}
                          className="py-3 px-3 border-r border-slate-200 text-center bg-amber-50/20 hover:bg-amber-100/60 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-center">
                            {isChecked ? (
                              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-100/90 px-2 py-1 rounded border border-emerald-300 shadow-xs">
                                <CheckSquare className="w-4 h-4 text-emerald-700" />
                                <span className="text-[10px]">Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-slate-400 opacity-60 hover:opacity-100">
                                <Square className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Clearance % */}
                    <td className="py-3 px-3 text-center bg-slate-50/80">
                      <span className="font-mono font-bold text-sm text-[#701627]">
                        {clearance}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
