import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getEffectivePermissions } from "@/lib/permissions";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, status: true, permissions: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const effectivePermissions = getEffectivePermissions(user.role, user.permissions);

  return NextResponse.json({ ...user, permissions: effectivePermissions });
}
