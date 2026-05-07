import { getSession } from "@/lib/session";
import { runLeadResearch } from "@/lib/researchEngine";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI not configured — add ANTHROPIC_API_KEY to environment variables" },
      { status: 503 }
    );
  }

  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const research = await runLeadResearch(leadId, session.name);
  if (!research) return NextResponse.json({ error: "Lead not found or research failed" }, { status: 404 });

  return NextResponse.json(research);
}
