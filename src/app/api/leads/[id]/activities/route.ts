import { NextRequest, NextResponse } from "next/server";
import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { type, note } = await req.json();

  const activity = await db.leadActivity.create({
    data: { leadId: id, type: type ?? "NOTE", note },
  });

  return NextResponse.json({ data: activity }, { status: 201 });
}
