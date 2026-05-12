"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  permission: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",          label: "Dashboard",         icon: "📊", exact: true, permission: "dashboard_view" },
  { href: "/dashboard/leads",    label: "Leads",             icon: "👥",              permission: "dhanveer_access" },
  { href: "/admin/discover",     label: "Discover Leads",    icon: "🔍",              permission: "dhanveer_access" },
  { href: "/dashboard/pipeline", label: "Pipeline",          icon: "📈",              permission: "dhanveer_access" },
  { href: "/dashboard/tasks",    label: "Tasks",             icon: "✅",              permission: "dhanveer_access" },
  { href: "/admin/reports",      label: "Reports",           icon: "📋",              permission: "dashboard_view" },
  { href: "/admin/sequences",    label: "WA Sequences",      icon: "📲",              permission: "dhanveer_access" },
  { href: "/admin/knowledge",    label: "Product Knowledge", icon: "📦",              permission: "products_view" },
  { href: "/admin/users",        label: "Users",             icon: "👤",              permission: "user_management" },
  { href: "/admin/settings",     label: "Integrations",      icon: "🔌",              permission: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setName(d.name);
        if (d.permissions) setPermissions(d.permissions);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => permissions === null || permissions.includes(item.permission)
  );

  function NavLink({ href, label, icon, exact = false }: NavItem) {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <li>
        <Link
          href={href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            active
              ? "bg-green-50 text-green-700 font-medium"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <span className="w-5 text-center">{icon}</span>
          {label}
        </Link>
      </li>
    );
  }

  return (
    <aside className="hidden lg:flex h-full w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
          <span className="text-sm font-bold text-white">D</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Dhanveer</p>
          <p className="text-xs text-slate-400">The Tea Planet</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
        <div>
          {name && <p className="text-xs font-medium text-slate-600 truncate max-w-[110px]">{name}</p>}
          <p className="text-xs text-slate-400">The Tea Planet CRM</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
