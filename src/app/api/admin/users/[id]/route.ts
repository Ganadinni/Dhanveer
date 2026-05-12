import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.id || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) return null;
  return session;
}

const USER_SELECT = {
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
} as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, role, password, permissions, status } = await req.json();

  // Fetch target user to enforce Super Admin protection
  const target = await db.user.findUnique({ where: { id }, select: { role: true, name: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Only SUPER_ADMIN can edit another SUPER_ADMIN
  if (target.role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only a Super Admin can modify another Super Admin" }, { status: 403 });
  }

  // Only SUPER_ADMIN can grant SUPER_ADMIN role
  if (role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only a Super Admin can grant the Super Admin role" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (name) data.name = name.trim();
  if (role) data.role = role;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  if (Array.isArray(permissions)) data.permissions = permissions;
  if (status) data.status = status;

  const user = await db.user.update({ where: { id }, data, select: USER_SELECT });

  await db.userAuditLog.create({
    data: {
      userId: id,
      actorId: session.id,
      actorName: session.name,
      action: "UPDATED",
      details: { changes: Object.keys(data) },
    },
  });

  return NextResponse.json({ user });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === session.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id }, select: { role: true, name: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot remove a Super Admin" }, { status: 403 });
  }

  await db.userAuditLog.create({
    data: {
      userId: id,
      actorId: session.id,
      actorName: session.name,
      action: "DELETED",
      details: { deletedName: target.name },
    },
  });

  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
