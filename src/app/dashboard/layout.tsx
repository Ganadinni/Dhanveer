import { AppShell } from "@/components/layout/AppShell";

export const metadata = {
  title: "Dashboard — Dhanveer",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
