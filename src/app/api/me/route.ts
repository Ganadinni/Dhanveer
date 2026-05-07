import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, permissions: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ADMIN implicitly has all features
  const effectivePermissions = user.role === "ADMIN"
    ? ["ai_pitch", "whatsapp", "manage_leads", "delete_leads"]
    : user.role === "SALES"
      ? [...new Set([...user.permissions, "manage_leads"])]
      : user.permissions;

  return NextResponse.json({ ...user, permissions: effectivePermissions });
}
