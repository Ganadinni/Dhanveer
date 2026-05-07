import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const leads = await db.lead.findMany({
    where: {
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
      assignedToId: session.user?.id ?? undefined,
    },
  });

  return NextResponse.json({ data: lead }, { status: 201 });
}
