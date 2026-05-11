import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const runs = await db.discoveryRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(runs);
}
