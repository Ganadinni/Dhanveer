import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface LeadRow {
  businessName: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows }: { rows: LeadRow[] } = await req.json();
  if (!rows?.length) return NextResponse.json({ error: "No rows provided" }, { status: 400 });

  const valid = rows.filter((r) => r.businessName?.trim());
  if (!valid.length) return NextResponse.json({ error: "No valid rows — businessName is required" }, { status: 400 });

  let created = 0;
  let skipped = 0;

  for (const row of valid) {
    try {
      // Skip if exact business name + phone already exists
      const exists = await db.lead.findFirst({
        where: {
          businessName: { equals: row.businessName.trim(), mode: "insensitive" },
          ...(row.phone ? { phone: row.phone.trim() } : {}),
        },
      });
      if (exists) { skipped++; continue; }

      await db.lead.create({
        data: {
          businessName: row.businessName.trim(),
          ownerName: row.ownerName?.trim() || null,
          phone: row.phone?.trim() || null,
          email: row.email?.trim() || null,
          address: row.address?.trim() || null,
          city: row.city?.trim() || null,
          state: row.state?.trim() || null,
          pincode: row.pincode?.trim() || null,
          notes: row.notes?.trim() || null,
          source: "MANUAL",
          assignedToId: session.id,
        },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ created, skipped, total: valid.length });
}
