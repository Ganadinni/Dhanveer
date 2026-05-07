import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { scoreLead } from "@/lib/pitchEngine";
import { enrollLead } from "@/lib/sequenceEngine";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

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

  const { rows, sequenceId }: { rows: LeadRow[]; sequenceId?: string } = await req.json();
  if (!rows?.length) return NextResponse.json({ error: "No rows provided" }, { status: 400 });

  const valid = rows.filter((r) => r.businessName?.trim());
  if (!valid.length) return NextResponse.json({ error: "No valid rows" }, { status: 400 });

  let created = 0;
  let skipped = 0;
  const createdIds: string[] = [];

  for (const row of valid) {
    try {
      const exists = await db.lead.findFirst({
        where: {
          businessName: { equals: row.businessName.trim(), mode: "insensitive" },
          ...(row.city ? { city: { equals: row.city.trim(), mode: "insensitive" } } : {}),
        },
      });
      if (exists) { skipped++; continue; }

      const lead = await db.lead.create({
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

      createdIds.push(lead.id);
      created++;
    } catch {
      skipped++;
    }
  }

  // Score + enroll all new leads (fire-and-forget — response returns immediately)
  Promise.all(
    createdIds.map(async (id) => {
      await scoreLead(id).catch(() => null);
      if (sequenceId) await enrollLead(id, sequenceId).catch(() => null);
    })
  ).catch(() => null);

  return NextResponse.json({ created, skipped, total: valid.length });
}
