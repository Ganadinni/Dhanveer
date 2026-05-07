import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET — Meta webhook verification handshake
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// POST — incoming messages from Meta
export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      for (const msg of value.messages) {
        if (msg.type !== "text") continue;

        const fromPhone = msg.from; // e.g. "918886277713"
        const text = msg.text?.body ?? "";
        const timestamp = new Date(parseInt(msg.timestamp) * 1000);

        // Find lead by phone number (try with and without country code)
        const lead = await db.lead.findFirst({
          where: {
            OR: [
              { phone: `+${fromPhone}` },
              { phone: fromPhone },
              { phone: fromPhone.slice(2) }, // strip country code
            ],
          },
        });

        if (lead) {
          await db.leadActivity.create({
            data: {
              leadId: lead.id,
              type: "WHATSAPP_RECEIVED",
              note: text,
              createdAt: timestamp,
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
  }

  // Always return 200 to Meta — otherwise it retries
  return NextResponse.json({ ok: true });
}
