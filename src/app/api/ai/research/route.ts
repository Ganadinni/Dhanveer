import { getSession } from "@/lib/session";
import { userHasPermission } from "@/lib/permissions";
import { runLeadResearch } from "@/lib/researchEngine";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await userHasPermission(session.id, session.role, "deep_research"))) {
    return NextResponse.json(
      { error: "You don't have access to Deep Research. Ask your admin to enable it." },
      { status: 403 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI not configured — add ANTHROPIC_API_KEY to environment variables" },
      { status: 503 }
    );
  }

  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const research = await runLeadResearch(leadId, session.name);
  if (!research) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  return NextResponse.json(research);
}
