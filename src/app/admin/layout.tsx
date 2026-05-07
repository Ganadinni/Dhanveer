import { AppShell } from "@/components/layout/AppShell";

export const metadata = { title: "Dhanveer" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
