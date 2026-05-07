import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { scoreLead } from "@/lib/pitchEngine";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  await scoreLead(leadId);
  const score = await db.leadScore.findUnique({ where: { leadId } });
  return NextResponse.json(score);
}

// Score all leads
export async function PUT(req: NextRequest) {
  void req;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leads = await db.lead.findMany({ select: { id: true } });
  let scored = 0;
  for (const lead of leads) {
    await scoreLead(lead.id);
    scored++;
  }
  return NextResponse.json({ scored });
}
