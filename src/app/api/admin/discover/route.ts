import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET — list all discovery search configs
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searches = await db.discoverySearch.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(searches);
}

// POST — create a new search config
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { label, cities, query, tagsToApply } = await req.json();
  if (!label || !cities?.length || !query) {
    return NextResponse.json({ error: "label, cities, and query are required" }, { status: 400 });
  }

  const search = await db.discoverySearch.create({
    data: {
      label: label.trim(),
      cities: cities.map((c: string) => c.trim()).filter(Boolean),
      query: query.trim(),
      tagsToApply: tagsToApply ?? [],
    },
  });
  return NextResponse.json(search, { status: 201 });
}
