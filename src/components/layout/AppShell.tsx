import { Sidebar } from "./Sidebar";
import { SalesChat } from "@/components/SalesChat";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <SalesChat />
    </div>
  );
}
