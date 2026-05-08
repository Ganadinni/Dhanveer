"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Home",     icon: "📊", exact: true },
  { href: "/dashboard/leads",    label: "Leads",    icon: "👥" },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: "📈" },
  { href: "/dashboard/tasks",    label: "Tasks",    icon: "✅" },
  { href: "/admin/discover",     label: "Discover", icon: "🔍" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 flex items-stretch h-16 safe-bottom">
      {NAV_ITEMS.map(({ href, label, icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              active ? "text-green-700" : "text-slate-400"
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            {label}
            {active && <span className="absolute bottom-0 w-8 h-0.5 bg-green-600 rounded-t-full" />}
          </Link>
        );
      })}
    </nav>
  );
}
