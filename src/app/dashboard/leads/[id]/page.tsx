export const dynamic = "force-dynamic";

import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { LeadDetailClient } from "./LeadDetailClient";
import { getEffectivePermissions, isAdminRole } from "@/lib/permissions";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = isAdminRole(session?.role ?? "");

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

  const role = currentUser?.role ?? session?.role ?? "VIEWER";
  const userPermissions = getEffectivePermissions(role, currentUser?.permissions ?? []);

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>
      <Header title={lead.businessName} subtitle={lead.city ?? undefined}>
        <Link href="/dashboard/leads" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Leads
        </Link>
      </Header>
      <div className="flex-1 flex overflow-hidden">
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
