export const dynamic = "force-dynamic";

import { getSession as auth } from "@/lib/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

export const metadata = { title: "Admin — Dhanveer" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.role !== "ADMIN") redirect("/dashboard");
  return <AppShell>{children}</AppShell>;
}
