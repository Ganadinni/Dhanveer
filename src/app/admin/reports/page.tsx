export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { ReportsClient } from "./ReportsClient";

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default async function ReportsPage() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [leadsByStatus, leadsBySource, reps, allLeads, discoveryRuns] = await Promise.all([
    db.lead.groupBy({ by: ["status"], _count: { id: true } }),
    db.lead.groupBy({ by: ["source"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    db.user.findMany({
      where: { role: { in: ["ADMIN", "SALES"] } },
      select: { id: true, name: true, leads: { select: { status: true } } },
      orderBy: { name: "asc" },
    }),
    db.lead.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true },
    }),
    db.discoveryRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 100,
    }),
  ]);

  // Monthly trend
  const monthBuckets: Record<string, { leads: number; won: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets[monthLabel(d)] = { leads: 0, won: 0 };
  }
  for (const lead of allLeads) {
    const key = monthLabel(new Date(lead.createdAt));
    if (monthBuckets[key]) {
      monthBuckets[key].leads++;
      if (lead.status === "WON") monthBuckets[key].won++;
    }
  }
  const monthly = Object.entries(monthBuckets).map(([month, v]) => ({ month, ...v }));

  // KPIs
  const total   = leadsByStatus.reduce((s, r) => s + r._count.id, 0);
  const won     = leadsByStatus.find((r) => r.status === "WON")?._count.id ?? 0;
  const lost    = leadsByStatus.find((r) => r.status === "LOST")?._count.id ?? 0;
  const active  = total - won - lost;
  const convPct = total > 0 ? Math.round((won / total) * 100) : 0;

  const kpis = [
    { label: "Total Leads",      value: total },
    { label: "Active Pipeline",  value: active,      sub: "excluding won & lost" },
    { label: "Won",              value: won,          accent: "text-green-600" },
    { label: "Conversion Rate",  value: `${convPct}%`, sub: `${lost} lost`, accent: convPct >= 20 ? "text-green-600" : "text-slate-900" },
  ];

  const byStatus = leadsByStatus.map((r) => ({ status: r.status, count: r._count.id }));
  const bySource = leadsBySource.map((r) => ({ source: r.source, count: r._count.id }));
  const byRep    = reps.map((u) => ({
    name:      u.name,
    total:     u.leads.length,
    won:       u.leads.filter((l) => l.status === "WON").length,
    contacted: u.leads.filter((l) => ["CONTACTED","QUALIFIED","PROPOSAL_SENT","NEGOTIATION","WON"].includes(l.status)).length,
    qualified: u.leads.filter((l) => ["QUALIFIED","PROPOSAL_SENT","NEGOTIATION","WON"].includes(l.status)).length,
  }));

  // Discovery run metrics
  const completedRuns = discoveryRuns.filter((r) => r.status === "COMPLETED");
  const totalAdded    = completedRuns.reduce((s, r) => s + r.added, 0);
  const avgAdded      = completedRuns.length > 0 ? Math.round(totalAdded / completedRuns.length) : 0;
  const mapsRuns      = completedRuns.filter((r) => r.searchType === "MAPS").length;
  const socialRuns    = completedRuns.filter((r) => r.searchType === "SOCIAL").length;

  const discoveryLog = discoveryRuns.map((r) => ({
    id:          r.id,
    searchLabel: r.searchLabel,
    searchType:  r.searchType,
    status:      r.status,
    added:       r.added,
    skipped:     r.skipped,
    errors:      r.errors,
    startedAt:   r.startedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
    runBy:       r.runBy,
    durationSec: r.completedAt
      ? Math.round((r.completedAt.getTime() - r.startedAt.getTime()) / 1000)
      : null,
  }));

  return (
    <div>
      <Header title="Reports & Analytics" subtitle="Pipeline health, lead sources, and rep performance" />
      <div className="p-4 md:p-6 space-y-8">
        <ReportsClient
          kpis={kpis}
          byStatus={byStatus}
          bySource={bySource}
          byRep={byRep}
          monthly={monthly}
        />

        {/* ── Discovery Run Log ──────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Discovery Search Log</h2>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Total Runs",       value: completedRuns.length },
              { label: "Leads Discovered", value: totalAdded, accent: "text-green-600" },
              { label: "Avg per Run",      value: avgAdded },
              { label: "Maps / Social",    value: `${mapsRuns} / ${socialRuns}` },
            ].map(({ label, value, accent }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
                <p className={`text-xl font-bold ${accent ?? "text-slate-900"}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {discoveryLog.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-400">No discovery runs yet. Go to Discover Leads and run a search.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Search</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Type</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Added</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Skipped</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 hidden md:table-cell">Run by</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 hidden md:table-cell">Duration</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {discoveryLog.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[180px] truncate">{run.searchLabel}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          run.searchType === "MAPS" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                        }`}>{run.searchType}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          run.status === "COMPLETED" ? "bg-green-50 text-green-700" :
                          run.status === "RUNNING"   ? "bg-amber-50 text-amber-700" :
                                                       "bg-red-50 text-red-600"
                        }`}>{run.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={run.added > 0 ? "font-semibold text-green-600" : "text-slate-400"}>
                          +{run.added}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-400">{run.skipped}</td>
                      <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">{run.runBy ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-400 hidden md:table-cell">
                        {run.durationSec !== null ? `${run.durationSec}s` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">
                        {new Date(run.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {" "}
                        {new Date(run.startedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
