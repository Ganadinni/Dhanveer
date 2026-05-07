import { db } from "@/lib/db";
import { runDiscovery } from "@/lib/discoveryEngine";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min max for daily cron across all searches

// Called daily by Vercel Cron — secured with CRON_SECRET
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searches = await db.discoverySearch.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (searches.length === 0) {
    return NextResponse.json({ message: "No active discovery searches configured" });
  }

  const summary: Array<{ label: string; added: number; skipped: number; errors: string[] }> = [];
  let totalAdded = 0;

  for (const config of searches) {
    const results = await runDiscovery(config.query, config.cities, config.tagsToApply);

    await db.discoverySearch.update({
      where: { id: config.id },
      data: {
        lastRunAt: new Date(),
        lastFoundCount: results.added,
        totalAdded: { increment: results.added },
      },
    });

    summary.push({ label: config.label, ...results });
    totalAdded += results.added;
  }

  console.log(`[Cron/Discover] ${new Date().toISOString()} — ${totalAdded} new leads added across ${searches.length} searches`);

  return NextResponse.json({ ok: true, totalAdded, summary });
}
