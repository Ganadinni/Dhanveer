import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { SalesChat } from "@/components/SalesChat";
import { getCurrentUser } from "@/lib/current-user";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar — desktop only */}
      <Sidebar
        userName={user?.name ?? ""}
        permissions={user?.effectivePermissions ?? []}
      />

      {/* Content area — scrolls independently */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        {/* pb-16 reserves space above the fixed mobile nav; removed on lg+ */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      <MobileNav />
      <SalesChat />
    </div>
  );
}
