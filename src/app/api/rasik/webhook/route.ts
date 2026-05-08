// Webhook receiver for events from Rasik → Dhanveer
// Rasik should POST to: https://dhanveer-izqx-git-claude-setup-ve-745a7f-founder-9869s-projects.vercel.app/api/rasik/webhook
// with header: x-rasik-secret: <RASIK_WEBHOOK_SECRET env var>

import { processRasikEvent } from "@/lib/rasik";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = process.env.RASIK_WEBHOOK_SECRET;
  if (secret) {
    const incoming = req.headers.get("x-rasik-secret");
    if (incoming !== secret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.eventType) {
    return NextResponse.json({ error: "eventType is required" }, { status: 400 });
  }

  try {
    await processRasikEvent(payload as Parameters<typeof processRasikEvent>[0]);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Rasik webhook error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

// Health check / event schema documentation
export async function GET() {
  return NextResponse.json({
    status: "ready",
    version: "1.0",
    description: "Dhanveer webhook endpoint for Rasik events",
    supportedEvents: [
      { type: "LEAD_QUALIFIED", description: "Rasik conversation qualified a lead", required: ["phone"] },
      { type: "PRODUCT_ENQUIRY", description: "Customer enquired about a product", required: ["phone", "message"] },
      { type: "ORDER_PLACED", description: "Customer placed an order via Rasik", required: ["phone", "rasikRef"] },
      { type: "CHAT_ENDED", description: "Conversation ended with summary", required: ["phone", "message"] },
      { type: "NEW_CONTACT", description: "New contact captured by Rasik", required: ["phone", "leadData.businessName"] },
    ],
    authHeader: "x-rasik-secret",
  });
}
