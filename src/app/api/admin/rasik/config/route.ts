import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await db.rasikConfig.findFirst();
  return NextResponse.json(config ?? null);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { baseUrl, apiKey, enabled } = await req.json();

  const existing = await db.rasikConfig.findFirst();
  let config;
  if (existing) {
    config = await db.rasikConfig.update({ where: { id: existing.id }, data: { baseUrl, apiKey, enabled } });
  } else {
    config = await db.rasikConfig.create({ data: { baseUrl, apiKey, enabled } });
  }
  return NextResponse.json(config);
}
