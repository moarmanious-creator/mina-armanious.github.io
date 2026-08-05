import React from 'react';
import { Partnership } from '../types/partnership';
import { calculateClearancePercentage } from '../data/initialPartnerships';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, ShieldAlert, Award } from 'lucide-react';

interface AnalyticsViewProps {
  partnerships: Partnership[];
}

const BRAND_COLORS = ['#701627', '#2563EB', '#D97706', '#059669', '#7C3AED', '#DB2777', '#475569'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ partnerships }) => {
  // 1. Stage Data
  const stageOrder = [
    '0. On Hold',
    '1. Exploration',
    '2. Negotiation',
    '3. Internal Approvals',
    '4. Signature',
  ];

  const stageData = stageOrder.map((stage) => {
    const count = partnerships.filter((p) => p.stage === stage).length;
    return { name: stage, count };
  });

  // 2. Category Breakdown
  const categoryMap: Record<string, number> = {};
  partnerships.forEach((p) => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
  });
  const categoryData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: categoryMap[cat],
  }));

  // 3. Document Status Data
  const statusMap: Record<string, number> = {};
  partnerships.forEach((p) => {
    statusMap[p.documentStatus] = (statusMap[p.documentStatus] || 0) + 1;
  });
  const statusData = Object.keys(statusMap).map((st) => ({
    name: st,
    value: statusMap[st],
  }));

  // 4. Strategic Driver Counts
  const driverCounts = [
    { name: 'Growth Engine', count: partnerships.filter((p) => p.valueDrivers.growthEngine).length },
    { name: 'Venture Clienting', count: partnerships.filter((p) => p.valueDrivers.ventureClienting).length },
    { name: 'Startup Friendly Bank', count: partnerships.filter((p) => p.valueDrivers.startupFriendlyBank).length },
    { name: 'Ecosystem Engagement', count: partnerships.filter((p) => p.valueDrivers.ecosystemEngagement).length },
    { name: 'Investment', count: partnerships.filter((p) => p.valueDrivers.investment).length },
  ];

  // 5. Entity Distribution
  const entityData = [
    { name: 'Banque Misr', count: partnerships.filter((p) => p.entity === 'Banque Misr').length },
    { name: 'MFI', count: partnerships.filter((p) => p.entity === 'MFI').length },
  ];

  return (
    <div id="analytics-dashboard" className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#701627]" />
            Strategic Portfolio Analytics & Insights
          </h2>
          <p className="text-xs text-slate-500">
            Real-time pipeline progression, entity balance, and strategic driver alignment breakdown.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Pipeline Stage Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Partnership Pipeline Progression
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#701627" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-purple-600" />
            Partner Categories Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name.split('/')[0]} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Strategic Drivers Alignment */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            Strategic Driver Coverage
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverCounts} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#D97706" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Document Status & Entity Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            Document Status Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-st-${index}`} fill={BRAND_COLORS[(index + 2) % BRAND_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
