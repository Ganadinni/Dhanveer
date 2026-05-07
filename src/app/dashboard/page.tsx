import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";

export default function DashboardPage() {
  // Placeholder stats — replace with real DB queries when backend is ready
  const stats = [
    { label: "Total Leads", value: "—", icon: "👥", trend: undefined },
    { label: "New This Week", value: "—", icon: "✨", trend: undefined },
    { label: "In Pipeline", value: "—", icon: "📈", trend: undefined },
    { label: "Won This Month", value: "—", icon: "🏆", trend: undefined },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        subtitle="Welcome back — here is your sales overview."
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatsCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
            />
          ))}
        </div>

        {/* Placeholder sections */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">
              Recent Leads
            </h2>
            <p className="text-sm text-slate-400">
              Lead list will appear here once data is connected.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">
              Activity Feed
            </h2>
            <p className="text-sm text-slate-400">
              Recent activities will stream here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
