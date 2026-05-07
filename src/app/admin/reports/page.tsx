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

  const [leadsByStatus, leadsBySource, reps, allLeads] = await Promise.all([
    db.lead.groupBy({ by: ["status"], _count: { id: true } }),
    db.lead.groupBy({ by: ["source"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    db.user.findMany({
      where: { role: { in: ["ADMIN", "SALES"] } },
      select: {
        id: true,
        name: true,
        leads: { select: { status: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.lead.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true },
    }),
  ]);

  // Monthly trend (last 6 months)
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
  const total = leadsByStatus.reduce((s, r) => s + r._count.id, 0);
  const won = leadsByStatus.find((r) => r.status === "WON")?._count.id ?? 0;
  const lost = leadsByStatus.find((r) => r.status === "LOST")?._count.id ?? 0;
  const active = total - won - lost;
  const convPct = total > 0 ? Math.round((won / total) * 100) : 0;

  const kpis = [
    { label: "Total Leads", value: total },
    { label: "Active Pipeline", value: active, sub: "excluding won & lost" },
    { label: "Won", value: won, accent: "text-green-600" },
    { label: "Conversion Rate", value: `${convPct}%`, sub: `${lost} lost`, accent: convPct >= 20 ? "text-green-600" : "text-slate-900" },
  ];

  // By status
  const byStatus = leadsByStatus.map((r) => ({ status: r.status, count: r._count.id }));

  // By source
  const bySource = leadsBySource.map((r) => ({ source: r.source, count: r._count.id }));

  // Rep breakdown
  const byRep = reps.map((u) => ({
    name: u.name,
    total: u.leads.length,
    won: u.leads.filter((l) => l.status === "WON").length,
    contacted: u.leads.filter((l) => ["CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON"].includes(l.status)).length,
    qualified: u.leads.filter((l) => ["QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON"].includes(l.status)).length,
  }));

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports & Analytics" subtitle="Pipeline health, lead sources, and rep performance" />
      <div className="flex-1 overflow-y-auto p-6">
        <ReportsClient
          kpis={kpis}
          byStatus={byStatus}
          bySource={bySource}
          byRep={byRep}
          monthly={monthly}
        />
      </div>
    </div>
  );
}
