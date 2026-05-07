import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { baseUrl, apiKey } = await req.json();
  if (!baseUrl) return NextResponse.json({ error: "baseUrl required" }, { status: 400 });

  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { "x-api-key": apiKey ?? "" },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: `Rasik returned ${res.status}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: `Connection failed: ${(err as Error).message}` }, { status: 400 });
  }
}
