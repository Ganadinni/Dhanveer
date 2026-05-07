import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sequences = await db.whatsAppSequence.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      _count: { select: { enrollments: true } },
    },
  });
  return NextResponse.json(sequences);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, steps } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const sequence = await db.whatsAppSequence.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      steps: steps?.length
        ? {
            create: steps.map((s: { delayDays: number; message: string }, i: number) => ({
              stepNumber: i,
              delayDays: Number(s.delayDays) || 0,
              message: s.message.trim(),
            })),
          }
        : undefined,
    },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });

  return NextResponse.json(sequence, { status: 201 });
}
