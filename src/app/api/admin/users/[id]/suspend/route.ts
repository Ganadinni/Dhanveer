import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.id || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) return null;
  return session;
}

// POST /api/admin/users/[id]/suspend  body: { suspend: boolean }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { suspend } = await req.json();

  if (id === session.id) {
    return NextResponse.json({ error: "Cannot suspend your own account" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id }, select: { role: true, name: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot suspend a Super Admin" }, { status: 403 });
  }

  const newStatus = suspend ? "SUSPENDED" : "ACTIVE";
  await db.user.update({ where: { id }, data: { status: newStatus } });

  await db.userAuditLog.create({
    data: {
      userId: id,
      actorId: session.id,
      actorName: session.name,
      action: suspend ? "SUSPENDED" : "UNSUSPENDED",
      details: { userName: target.name },
    },
  });

  return NextResponse.json({ ok: true, status: newStatus });
}
