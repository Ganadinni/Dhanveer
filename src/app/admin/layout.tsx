import { AppShell } from "@/components/layout/AppShell";

export const metadata = {
  title: "Admin — Dhanveer",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
