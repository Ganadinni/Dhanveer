// API for Rasik to query lead data from Dhanveer
// Rasik should include header: x-api-key: <RASIK_API_KEY env var>

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function validateRasikKey(req: NextRequest) {
  const key = process.env.RASIK_API_KEY;
  if (!key) return true; // no key configured = open (for dev)
  return req.headers.get("x-api-key") === key;
}

// GET /api/rasik/leads?phone=xxx  OR  GET /api/rasik/leads?status=NEW
export async function GET(req: NextRequest) {
  if (!validateRasikKey(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const status = searchParams.get("status");
  const city = searchParams.get("city");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (phone) where.phone = { contains: phone };
  if (status) where.status = status;
  if (city) where.city = { contains: city, mode: "insensitive" };

  const leads = await db.lead.findMany({
    where,
    select: {
      id: true,
      businessName: true,
      ownerName: true,
      phone: true,
      email: true,
      city: true,
      state: true,
      status: true,
      source: true,
      createdAt: true,
      score: { select: { score: true, tier: true } },
    },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leads, total: leads.length });
}
