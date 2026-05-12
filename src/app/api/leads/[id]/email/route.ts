import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { userHasPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await userHasPermission(session.id, session.role, "dhanveer_access"))) {
    return NextResponse.json({ error: "You don't have access to this feature. Ask your admin to enable Dhanveer access." }, { status: 403 });
  }

  const { id } = await params;
  const { subject, body } = await req.json();

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "subject and body are required" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "Lead has no email address" }, { status: 400 });

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email not configured — add SMTP_HOST, SMTP_USER, SMTP_PASS to environment variables" },
      { status: 503 }
    );
  }

  await sendEmail({ to: lead.email, subject: subject.trim(), body: body.trim() });

  const activity = await db.leadActivity.create({
    data: {
      leadId: id,
      type: "EMAIL",
      note: `[${subject.trim()}]\n${body.trim()}`,
    },
  });

  return NextResponse.json({ ok: true, activity });
}
