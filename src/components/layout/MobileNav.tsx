"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  permission: string;
}

// Bottom bar shows these 4 + the "More" button
const PRIMARY_ITEMS: NavItem[] = [
  { href: "/dashboard",          label: "Home",     icon: "📊", exact: true, permission: "dashboard_view" },
  { href: "/dashboard/leads",    label: "Leads",    icon: "👥",              permission: "dhanveer_access" },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: "📈",              permission: "dhanveer_access" },
  { href: "/dashboard/tasks",    label: "Tasks",    icon: "✅",              permission: "dhanveer_access" },
];

// These appear in the "More" drawer
const SECONDARY_ITEMS: NavItem[] = [
  { href: "/admin/discover",     label: "Discover Leads",    icon: "🔍", permission: "dhanveer_access" },
  { href: "/admin/reports",      label: "Reports",           icon: "📋", permission: "dashboard_view" },
  { href: "/admin/sequences",    label: "WA Sequences",      icon: "📲", permission: "dhanveer_access" },
  { href: "/admin/knowledge",    label: "Product Knowledge", icon: "📦", permission: "products_view" },
  { href: "/admin/users",        label: "Users",             icon: "👤", permission: "user_management" },
  { href: "/admin/settings",     label: "Integrations",      icon: "🔌", permission: "settings" },
];

interface MobileNavProps {
  permissions: string[];
}

export function MobileNav({ permissions }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visiblePrimary   = PRIMARY_ITEMS.filter((i) => permissions.includes(i.permission));
  const visibleSecondary = SECONDARY_ITEMS.filter((i) => permissions.includes(i.permission));

  // Check if current page is one of the secondary items (to highlight "More")
  const moreActive = visibleSecondary.some((i) => pathname.startsWith(i.href));

  async function handleLogout() {
    setDrawerOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleNavClick() {
    setDrawerOpen(false);
  }

  return (
    <>
      {/* Bottom navigation bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 pb-safe">
        <div className="flex items-stretch h-16">
          {visiblePrimary.map(({ href, label, icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-h-[44px] ${
                  active ? "text-green-700" : "text-slate-400"
                }`}
              >
                <span className="text-[22px] leading-none">{icon}</span>
                <span>{label}</span>
                {active && (
                  <span className="absolute top-0 inset-x-3 h-0.5 bg-green-600 rounded-b-full" />
                )}
              </Link>
            );
          })}

          {/* More button — always visible */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-h-[44px] ${
              moreActive || drawerOpen ? "text-green-700" : "text-slate-400"
            }`}
          >
            <span className="text-[22px] leading-none">☰</span>
            <span>More</span>
            {(moreActive || drawerOpen) && (
              <span className="absolute top-0 inset-x-3 h-0.5 bg-green-600 rounded-b-full" />
            )}
          </button>
        </div>
      </nav>

      {/* Drawer backdrop */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-up drawer */}
      <div
        className={`lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">More</p>
          <ul className="space-y-1">
            {visibleSecondary.map(({ href, label, icon }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-green-50 text-green-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xl w-7 text-center">{icon}</span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sign out */}
        <div className="border-t border-slate-100 mx-4 mt-2 pt-3 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <span className="text-xl w-7 text-center">🚪</span>
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
