export const dynamic = "force-dynamic";

import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) redirect("/access-denied");

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      permissions: true,
      lastLogin: true,
      approvedBy: true,
      invitedBy: true,
      createdAt: true,
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const serialized = users.map((u) => ({
    ...u,
    lastLogin: u.lastLogin?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  const pendingCount = users.filter((u) => u.status === "PENDING").length;

  return (
    <div>
      <Header
        title="Team Members"
        subtitle="Manage access, roles, and permissions"
      />
      <div className="p-4 md:p-6">
        <UsersClient
          initialUsers={serialized}
          currentUserId={session.id}
          currentUserRole={session.role}
          pendingCount={pendingCount}
        />
      </div>
    </div>
  );
}
