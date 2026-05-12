import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_DOMAIN = "@theteaplanet.com";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (!normalizedEmail.endsWith(ALLOWED_DOMAIN)) {
    return NextResponse.json(
      { error: "Access restricted to The Tea Planet team members only." },
      { status: 403 }
    );
  }

  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (user.status === "PENDING") {
    return NextResponse.json(
      { error: "Your account is pending admin approval. You will be notified once access is granted." },
      { status: 403 }
    );
  }

  if (user.status === "SUSPENDED") {
    return NextResponse.json(
      { error: "Your account has been suspended. Please contact an administrator." },
      { status: 403 }
    );
  }

  // Update last login
  await db.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, status: user.status });
  return NextResponse.json({ ok: true });
}
