export const dynamic = "force-dynamic";

import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const session = await auth();

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      createdAt: true,
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Team Members" subtitle="Manage access, roles, and lead assignments" />
      <div className="flex-1 overflow-y-auto p-6">
        <UsersClient
          initialUsers={JSON.parse(JSON.stringify(users))}
          currentUserId={session!.id}
        />
      </div>
    </div>
  );
}
