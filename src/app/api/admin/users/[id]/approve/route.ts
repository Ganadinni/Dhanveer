import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.id || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) return null;
  return session;
}

// POST /api/admin/users/[id]/approve  body: { action: "approve" | "reject" }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json();

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id }, select: { status: true, name: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.status !== "PENDING") {
    return NextResponse.json({ error: "User is not in pending state" }, { status: 400 });
  }

  if (action === "approve") {
    await db.user.update({
      where: { id },
      data: { status: "ACTIVE", approvedBy: session.name },
    });
    await db.userAuditLog.create({
      data: {
        userId: id,
        actorId: session.id,
        actorName: session.name,
        action: "APPROVED",
        details: { userName: target.name },
      },
    });
    return NextResponse.json({ ok: true, status: "ACTIVE" });
  } else {
    // Reject = delete the pending account
    await db.userAuditLog.create({
      data: {
        userId: id,
        actorId: session.id,
        actorName: session.name,
        action: "REJECTED",
        details: { userName: target.name },
      },
    });
    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }
}
