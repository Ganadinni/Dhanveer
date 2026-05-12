import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const ALLOWED_DOMAIN = "@theteaplanet.com";

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

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await db.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, email, password, role } = await req.json();
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.endsWith(ALLOWED_DOMAIN)) {
    return NextResponse.json(
      { error: "Only @theteaplanet.com email addresses are allowed." },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  // Only SUPER_ADMIN can create another SUPER_ADMIN
  if (role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only a Super Admin can create another Super Admin" }, { status: 403 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role ?? "SALES",
      status: "ACTIVE",
      invitedBy: session.name,
      approvedBy: session.name,
    },
    select: USER_SELECT,
  });

  await db.userAuditLog.create({
    data: {
      userId: user.id,
      actorId: session.id,
      actorName: session.name,
      action: "CREATED",
      details: { role: user.role, email: user.email },
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
