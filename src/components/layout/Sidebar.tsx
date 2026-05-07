"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const salesItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", exact: true },
  { href: "/dashboard/leads", label: "Leads", icon: "👥" },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: "📈" },
  { href: "/dashboard/tasks", label: "Tasks", icon: "✅" },
];

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: "⚙️", exact: true },
  { href: "/admin/users", label: "Users", icon: "👤" },
  { href: "/admin/reports", label: "Reports", icon: "📋" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => {
      if (d.role) setRole(d.role);
      if (d.name) setName(d.name);
    }).catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const isAdmin = role === "ADMIN";

  function NavLink({ href, label, icon, exact = false }: { href: string; label: string; icon: string; exact?: boolean }) {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <li>
        <Link
          href={href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            active ? "bg-green-50 text-green-700 font-medium" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <span>{icon}</span>
          {label}
        </Link>
      </li>
    );
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-white">
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
        <p className="mb-1 px-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Sales</p>
        <ul className="space-y-0.5">
          {salesItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </ul>

        {isAdmin && (
          <>
            <p className="mb-1 mt-6 px-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Admin</p>
            <ul className="space-y-0.5">
              {adminItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
        <div>
          {name && <p className="text-xs font-medium text-slate-600 truncate max-w-[100px]">{name}</p>}
          <p className="text-xs text-slate-400">v0.1.0</p>
        </div>
        <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  );
}
