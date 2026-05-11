import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { runSocialMonitor } from "@/lib/socialEngine";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const monitor = await db.socialMonitor.findUnique({ where: { id } });
  if (!monitor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const run = await db.discoveryRun.create({
    data: {
      monitorId:   id,
      searchLabel: monitor.label,
      searchType:  "SOCIAL",
      status:      "RUNNING",
      runBy:       session.name ?? session.email,
    },
  });

  try {
    const result = await runSocialMonitor(id);

    await db.discoveryRun.update({
      where: { id: run.id },
      data: {
        status:      "COMPLETED",
        added:       result.added ?? 0,
        skipped:     result.skipped ?? 0,
        errors:      result.errors ?? [],
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ runId: run.id, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.discoveryRun.update({
      where: { id: run.id },
      data: { status: "FAILED", errors: [msg], completedAt: new Date() },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
