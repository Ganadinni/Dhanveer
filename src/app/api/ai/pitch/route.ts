import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { generatePitch } from "@/lib/pitchEngine";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { activities: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  try {
    const pitch = await generatePitch(lead);
    return NextResponse.json(pitch);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Pitch] Failed:", message);
    return NextResponse.json({ error: `Pitch generation failed: ${message}` }, { status: 500 });
  }
}
