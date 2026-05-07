export const dynamic = "force-dynamic";

import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { LeadDetailClient } from "./LeadDetailClient";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = session?.role === "ADMIN";

  const [lead, users, currentUser] = await Promise.all([
    db.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        activities: { orderBy: { createdAt: "desc" } },
        tasks: { where: { completed: false }, orderBy: { dueDate: "asc" } },
        score: true,
      },
    }),
    isAdmin
      ? db.user.findMany({ select: { id: true, name: true, role: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    session?.id
      ? db.user.findUnique({ where: { id: session.id }, select: { role: true, permissions: true } })
      : Promise.resolve(null),
  ]);

  if (!lead) notFound();

  // Compute effective permissions (same logic as /api/me)
  const rawPermissions = currentUser?.permissions ?? [];
  const role = currentUser?.role ?? session?.role ?? "VIEWER";
  const userPermissions: string[] = isAdmin
    ? ["ai_pitch", "whatsapp", "manage_leads", "delete_leads"]
    : role === "SALES"
      ? [...new Set([...rawPermissions, "manage_leads"])]
      : rawPermissions;

  return (
    <div className="flex flex-col h-full">
      <Header title={lead.businessName} subtitle={lead.city ?? undefined}>
        <Link href="/dashboard/leads" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Leads
        </Link>
      </Header>
      <div className="flex-1 overflow-y-auto p-6">
        <LeadDetailClient
          lead={JSON.parse(JSON.stringify(lead))}
          isAdmin={isAdmin}
          users={JSON.parse(JSON.stringify(users))}
          userPermissions={userPermissions}
        />
      </div>
    </div>
  );
}
