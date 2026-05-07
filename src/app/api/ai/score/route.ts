import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { scoreLead } from "@/lib/pitchEngine";
import { userHasPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await userHasPermission(session.id, session.role, "ai_pitch"))) {
    return NextResponse.json({ error: "You don't have access to Lead Scoring. Ask your admin to enable it." }, { status: 403 });
  }

  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  await scoreLead(leadId);
  const score = await db.leadScore.findUnique({ where: { leadId } });
  return NextResponse.json(score);
}

// Score all leads (admin only)
export async function PUT(req: NextRequest) {
  void req;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leads = await db.lead.findMany({ select: { id: true } });
  let scored = 0;
  for (const lead of leads) {
    await scoreLead(lead.id);
    scored++;
  }
  return NextResponse.json({ scored });
}
