import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST — add a step, PUT — replace all steps
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sequenceId } = await params;
  const { delayDays, message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "message required" }, { status: 400 });

  const count = await db.whatsAppSequenceStep.count({ where: { sequenceId } });
  const step = await db.whatsAppSequenceStep.create({
    data: { sequenceId, stepNumber: count, delayDays: Number(delayDays) || 0, message: message.trim() },
  });
  return NextResponse.json(step, { status: 201 });
}

// PUT — replace all steps at once (used by the builder UI)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sequenceId } = await params;
  const { steps } = await req.json() as { steps: Array<{ delayDays: number; message: string }> };

  await db.whatsAppSequenceStep.deleteMany({ where: { sequenceId } });
  if (steps?.length) {
    await db.whatsAppSequenceStep.createMany({
      data: steps.map((s, i) => ({
        sequenceId,
        stepNumber: i,
        delayDays: Number(s.delayDays) || 0,
        message: s.message.trim(),
      })),
    });
  }

  const updated = await db.whatsAppSequence.findUnique({
    where: { id: sequenceId },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });
  return NextResponse.json(updated);
}
