import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await db.product.findMany({
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const product = await db.product.create({ data: body, include: { category: { select: { id: true, name: true } } } });
  return NextResponse.json(product, { status: 201 });
}
