"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/leads", label: "Leads", icon: "👥" },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: "📈" },
  { href: "/dashboard/tasks", label: "Tasks", icon: "✅" },
  { href: "/dashboard/reports", label: "Reports", icon: "📋" },
];

const adminItems = [
  { href: "/admin", label: "Admin", icon: "⚙️" },
  { href: "/admin/users", label: "Users", icon: "👤" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
          <span className="text-sm font-bold text-white">D</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Dhanveer</p>
          <p className="text-xs text-slate-400">The Tea Planet</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-1 px-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
          Sales
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mb-1 mt-6 px-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
          Settings
        </p>
        <ul className="space-y-0.5">
          {adminItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-slate-100 text-slate-900 font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-400">v0.1.0 &bull; Internal</p>
      </div>
    </aside>
  );
}
