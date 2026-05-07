import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// PATCH — toggle active / update
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const search = await db.discoverySearch.update({
    where: { id },
    data: {
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
      ...(body.label ? { label: body.label } : {}),
      ...(body.cities ? { cities: body.cities } : {}),
      ...(body.query ? { query: body.query } : {}),
      ...(body.tagsToApply ? { tagsToApply: body.tagsToApply } : {}),
    },
  });
  return NextResponse.json(search);
}

// DELETE — remove a search config
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.discoverySearch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
