export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { Header } from "@/components/layout/Header";

export default async function ReportsPage() {
  const [leadsByStatus, leadsBySource, leadsByRep] = await Promise.all([
    db.lead.groupBy({ by: ["status"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    db.lead.groupBy({ by: ["source"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    db.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        _count: { select: { leads: true } },
        leads: {
          select: { status: true },
          where: { status: "WON" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const total = leadsByStatus.reduce((s, r) => s + r._count.id, 0);
  const won = leadsByStatus.find((r) => r.status === "WON")?._count.id ?? 0;

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports" subtitle="Lead source, pipeline, and rep performance" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Leads", value: total },
            { label: "Won", value: won },
            { label: "Conversion", value: total > 0 ? `${Math.round((won / total) * 100)}%` : "—" },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider">{m.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Pipeline by status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Pipeline by Stage</h3>
            <div className="space-y-2">
              {leadsByStatus.map((r) => (
                <div key={r.status} className="flex items-center gap-3">
                  <span className="text-xs w-32 text-slate-500 shrink-0">{r.status.replace(/_/g, " ")}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${Math.round((r._count.id / total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 w-6 text-right">{r._count.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leads by source */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Leads by Source</h3>
            <div className="space-y-2">
              {leadsBySource.map((r) => (
                <div key={r.source} className="flex items-center gap-3">
                  <span className="text-xs w-32 text-slate-500 shrink-0">{r.source.replace(/_/g, " ")}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${Math.round((r._count.id / total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 w-6 text-right">{r._count.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rep performance */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">Rep Performance</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-medium text-slate-500">Rep</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500">Role</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500">Leads</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500">Won</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leadsByRep.map((u) => {
                const wonCount = u.leads.length;
                const totalLeads = u._count.leads;
                const conv = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-5 py-3 text-slate-500">{u.role}</td>
                    <td className="px-5 py-3 text-slate-700">{totalLeads}</td>
                    <td className="px-5 py-3 text-slate-700">{wonCount}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conv >= 20 ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
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
    </div>
  );
}
