"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const STATUS_ORDER = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];
const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#eab308",
  QUALIFIED: "#a855f7",
  PROPOSAL_SENT: "#f97316",
  NEGOTIATION: "#ec4899",
  WON: "#22c55e",
  LOST: "#f87171",
};
const SOURCE_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#eab308", "#ec4899"];

interface KPI { label: string; value: string | number; sub?: string; accent?: string }
interface StatusRow { status: string; count: number }
interface SourceRow { source: string; count: number }
interface RepRow { name: string; total: number; won: number; contacted: number; qualified: number }
interface MonthRow { month: string; leads: number; won: number }

export function ReportsClient({
  kpis,
  byStatus,
  bySource,
  byRep,
  monthly,
}: {
  kpis: KPI[];
  byStatus: StatusRow[];
  bySource: SourceRow[];
  byRep: RepRow[];
  monthly: MonthRow[];
}) {
  const funnelData = STATUS_ORDER
    .filter((s) => s !== "LOST")
    .map((s) => ({
      name: s.replace(/_/g, " "),
      value: byStatus.find((r) => r.status === s)?.count ?? 0,
      fill: STATUS_COLORS[s],
    }))
    .filter((d) => d.value > 0);

  const sourceData = bySource.map((r) => ({
    name: r.source.replace(/_/g, " "),
    value: r.count,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.accent ?? "text-slate-900"}`}>{k.value}</p>
            {k.sub && <p className="text-xs text-slate-400 mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Trend — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="New Leads" />
            <Line type="monotone" dataKey="won" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Won" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Conversion Funnel</h3>
          {funnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <FunnelChart>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" style={{ fontSize: "11px" }} />
                  <LabelList position="center" fill="#fff" stroke="none" dataKey="value" style={{ fontSize: "12px", fontWeight: 600 }} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Lead Source Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Lead Source Breakdown</h3>
          {sourceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {sourceData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-medium text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Rep Performance Bar Chart */}
      {byRep.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Rep Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byRep} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="total" name="Total Leads" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="contacted" name="Contacted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="won" name="Won" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rep Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700">Rep Leaderboard</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-2.5 font-medium text-slate-500">Rep</th>
              <th className="text-right px-5 py-2.5 font-medium text-slate-500">Total</th>
              <th className="text-right px-5 py-2.5 font-medium text-slate-500">Contacted</th>
              <th className="text-right px-5 py-2.5 font-medium text-slate-500">Qualified</th>
              <th className="text-right px-5 py-2.5 font-medium text-slate-500">Won</th>
              <th className="text-right px-5 py-2.5 font-medium text-slate-500">Conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {byRep
              .slice()
              .sort((a, b) => b.won - a.won)
              .map((u) => {
                const conv = u.total > 0 ? Math.round((u.won / u.total) * 100) : 0;
                return (
                  <tr key={u.name} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{u.total}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{u.contacted}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{u.qualified}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{u.won}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conv >= 20 ? "bg-green-50 text-green-700" : conv > 0 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                        {conv}%
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
