import { processDueSequences } from "@/lib/sequenceEngine";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processDueSequences();
  console.log(`[Cron/Sequences] ${new Date().toISOString()} — sent: ${result.sent}, errors: ${result.errors}`);
  return NextResponse.json({ ok: true, ...result });
}
