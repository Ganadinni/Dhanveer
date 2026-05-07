interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatsCard({ label, value, icon, trend, trendUp }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {trend && (
        <p
          className={`mt-1 text-xs font-medium ${
            trendUp ? "text-green-600" : "text-red-500"
          }`}
        >
          {trendUp ? "↑" : "↓"} {trend}
        </p>
      )}
    </div>
  );
}
