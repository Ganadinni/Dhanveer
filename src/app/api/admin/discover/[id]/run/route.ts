import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { runDiscovery } from "@/lib/discoveryEngine";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const config = await db.discoverySearch.findUnique({ where: { id } });
  if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results = await runDiscovery(config.query, config.cities, config.tagsToApply);

  await db.discoverySearch.update({
    where: { id },
    data: {
      lastRunAt: new Date(),
      lastFoundCount: results.added,
      totalAdded: { increment: results.added },
    },
  });

  return NextResponse.json(results);
}
