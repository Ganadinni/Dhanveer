import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { generatePitch } from "@/lib/pitchEngine";
import { userHasPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await userHasPermission(session.id, session.role, "ai_pitch"))) {
    return NextResponse.json({ error: "You don't have access to AI Pitch. Ask your admin to enable it." }, { status: 403 });
  }

  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const pitch = await generatePitch(lead);
  return NextResponse.json(pitch);
}
