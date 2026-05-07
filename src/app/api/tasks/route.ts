import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filter = req.nextUrl.searchParams.get("filter"); // today | overdue | upcoming | all
  const leadId = req.nextUrl.searchParams.get("leadId");

  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const where: Record<string, unknown> = { completed: false };
  if (leadId) where.leadId = leadId;

  if (filter === "today") {
    where.dueDate = { gte: todayStart, lte: todayEnd };
  } else if (filter === "overdue") {
    where.dueDate = { lt: todayStart };
  } else if (filter === "upcoming") {
    where.dueDate = { gt: todayEnd };
  }

  const tasks = await db.task.findMany({
    where,
    include: {
      lead: { select: { id: true, businessName: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, type, dueDate, notes, leadId } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const task = await db.task.create({
    data: {
      title: title.trim(),
      type: type ?? "FOLLOW_UP",
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes ?? null,
      leadId: leadId ?? null,
      assignedToId: session.user.id,
    },
    include: {
      lead: { select: { id: true, businessName: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
