import { NextRequest, NextResponse } from "next/server";
import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: lead });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, assignedToId, notes, tags } = await req.json();

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
  if (notes !== undefined) data.notes = notes;
  if (Array.isArray(tags)) data.tags = tags;

  const lead = await db.lead.update({ where: { id }, data });
  return NextResponse.json({ data: lead });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
