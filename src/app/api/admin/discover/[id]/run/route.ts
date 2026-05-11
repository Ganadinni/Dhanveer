import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { runDiscovery } from "@/lib/discoveryEngine";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const config = await db.discoverySearch.findUnique({ where: { id } });
  if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Log the run immediately — result saved in DB even if client navigates away
  const run = await db.discoveryRun.create({
    data: {
      searchId:    id,
      searchLabel: config.label,
      searchType:  "MAPS",
      status:      "RUNNING",
      runBy:       session.name ?? session.email,
    },
  });

  try {
    const results = await runDiscovery(config.query, config.cities, config.tagsToApply);

    await Promise.all([
      db.discoverySearch.update({
        where: { id },
        data: {
          lastRunAt:      new Date(),
          lastFoundCount: results.added,
          totalAdded:     { increment: results.added },
        },
      }),
      db.discoveryRun.update({
        where: { id: run.id },
        data: {
          status:      "COMPLETED",
          added:       results.added,
          skipped:     results.skipped,
          errors:      results.errors ?? [],
          completedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ runId: run.id, ...results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.discoveryRun.update({
      where: { id: run.id },
      data: { status: "FAILED", errors: [msg], completedAt: new Date() },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
