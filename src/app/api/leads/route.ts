import { NextRequest, NextResponse } from "next/server";
import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const isSales = session.role === "SALES";

  const leads = await db.lead.findMany({
    where: {
      ...(isSales && { assignedToId: session.id }),
      ...(status && { status: status as never }),
      ...(city && { city }),
      ...(search && {
        OR: [
          { businessName: { contains: search, mode: "insensitive" } },
          { ownerName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      }),
    },
    include: { assignedTo: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ data: leads });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { businessName, ownerName, phone, email, address, city, state, pincode, source, notes } = body;

  if (!businessName) {
    return NextResponse.json({ error: "businessName is required" }, { status: 400 });
  }

  // Duplicate check — same business name in the same city (case-insensitive)
  const duplicate = await db.lead.findFirst({
    where: {
      businessName: { equals: businessName, mode: "insensitive" },
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
    },
    select: { id: true, businessName: true, city: true, status: true },
  });
  if (duplicate) {
    return NextResponse.json(
      {
        error: `A lead for "${duplicate.businessName}"${duplicate.city ? ` in ${duplicate.city}` : ""} already exists.`,
        existingId: duplicate.id,
        existingName: duplicate.businessName,
        existingCity: duplicate.city,
      },
      { status: 409 }
    );
  }

  const lead = await db.lead.create({
    data: {
      businessName,
      ownerName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      source: source ?? "MANUAL",
      notes,
      assignedToId: session.id ?? undefined,
    },
  });

  return NextResponse.json({ data: lead }, { status: 201 });
}
