import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { enrollLead } from "@/lib/sequenceEngine";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST — enroll lead in a sequence
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: leadId } = await params;
  const { sequenceId } = await req.json();
  if (!sequenceId) return NextResponse.json({ error: "sequenceId required" }, { status: 400 });

  await enrollLead(leadId, sequenceId);

  const enrollment = await db.leadSequenceEnrollment.findUnique({
    where: { leadId_sequenceId: { leadId, sequenceId } },
    include: { sequence: { select: { name: true } } },
  });
  return NextResponse.json(enrollment);
}

// GET — list enrollments for this lead
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: leadId } = await params;
  const enrollments = await db.leadSequenceEnrollment.findMany({
    where: { leadId },
    include: {
      sequence: {
        select: { name: true, steps: { select: { stepNumber: true }, orderBy: { stepNumber: "asc" } } },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });
  return NextResponse.json(enrollments);
}

// PATCH — update enrollment status (pause/resume/unsubscribe)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: leadId } = await params;
  const { sequenceId, status } = await req.json();

  const enrollment = await db.leadSequenceEnrollment.update({
    where: { leadId_sequenceId: { leadId, sequenceId } },
    data: { status },
  });
  return NextResponse.json(enrollment);
}
