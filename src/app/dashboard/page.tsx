export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const [total, newLeads, won, recentLeads] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { status: "NEW" } }),
    db.lead.count({ where: { status: "WON" } }),
    db.lead.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, businessName: true, status: true, city: true, createdAt: true },
    }),
  ]);

  const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;

  const stats = [
    { label: "Total Leads", value: total, icon: "👥" },
    { label: "New Leads", value: newLeads, icon: "✨" },
    { label: "Won", value: won, icon: "🏆" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: "📈" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    NEW: "bg-blue-50 text-blue-700",
    CONTACTED: "bg-yellow-50 text-yellow-700",
    QUALIFIED: "bg-purple-50 text-purple-700",
    PROPOSAL_SENT: "bg-orange-50 text-orange-700",
    NEGOTIATION: "bg-pink-50 text-pink-700",
    WON: "bg-green-50 text-green-700",
    LOST: "bg-red-50 text-red-700",
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Header title="Dashboard" subtitle="Your sales overview — The Tea Planet" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatsCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Recent Leads</h2>
              <Link href="/dashboard/leads" className="text-sm text-green-600 hover:text-green-700">
                View all →
              </Link>
            </div>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-slate-400">No leads yet. <Link href="/dashboard/leads/new" className="text-green-600">Add one →</Link></p>
            ) : (
              <ul className="space-y-2">
                {recentLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link href={`/dashboard/leads/${lead.id}`} className="flex items-center justify-between py-2 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{lead.businessName}</p>
                        <p className="text-xs text-slate-400">{lead.city ?? "No city"}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                        {lead.status.replace("_", " ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/dashboard/leads/new" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-green-200 hover:bg-green-50 transition-all">
                <span className="text-xl">➕</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">Add New Lead</p>
                  <p className="text-xs text-slate-400">Manually enter a business lead</p>
                </div>
              </Link>
              <Link href="/dashboard/leads" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                <span className="text-xl">👥</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">View All Leads</p>
                  <p className="text-xs text-slate-400">Browse and manage your pipeline</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
    </div>
  );
}
