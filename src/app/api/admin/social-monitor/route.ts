import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const monitors = await db.socialMonitor.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(monitors);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label, keywords, platforms, cities, tagsToApply } = await req.json();
  if (!label || !keywords?.length || !platforms?.length || !cities?.length) {
    return NextResponse.json({ error: "label, keywords, platforms, and cities are required" }, { status: 400 });
  }

  const monitor = await db.socialMonitor.create({
    data: {
      label: label.trim(),
      keywords: keywords.map((k: string) => k.trim()).filter(Boolean),
      platforms,
      cities: cities.map((c: string) => c.trim()).filter(Boolean),
      tagsToApply: tagsToApply ?? [],
    },
  });
  return NextResponse.json(monitor, { status: 201 });
}
