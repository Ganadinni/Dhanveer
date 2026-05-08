import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { SalesChat } from "@/components/SalesChat";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      {/* Sidebar — visible on lg+ only */}
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Extra bottom padding on mobile so content clears the bottom nav bar */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{children}</main>
      </div>
      {/* Bottom nav — visible on mobile only */}
      <MobileNav />
      <SalesChat />
    </div>
  );
}
