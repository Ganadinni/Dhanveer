import { getSession as auth } from "@/lib/session";
import { db } from "@/lib/db";
import { userHasPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

const GRAPH_URL = "https://graph.facebook.com/v19.0";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await userHasPermission(session.id, session.role, "dhanveer_access"))) {
    return NextResponse.json({ error: "You don't have access to WhatsApp messaging. Ask your admin to enable Dhanveer access." }, { status: 403 });
  }

  const { leadId, to, message } = await req.json();
  if (!to || !message?.trim()) {
    return NextResponse.json({ error: "to and message are required" }, { status: 400 });
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_API_TOKEN;

  if (!phoneNumberId || !token) {
    return NextResponse.json(
      { error: "WhatsApp not configured — add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_API_TOKEN to environment variables" },
      { status: 503 }
    );
  }

  // Normalise phone: strip spaces/dashes, ensure it starts with country code
  const phone = to.replace(/[\s\-().]/g, "").replace(/^\+/, "");

  const waRes = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message.trim() },
    }),
  });

  const waData = await waRes.json();

  if (!waRes.ok) {
    return NextResponse.json(
      { error: waData.error?.message ?? "WhatsApp API error", details: waData },
      { status: waRes.status }
    );
  }

  // Log as activity
  if (leadId) {
    await db.leadActivity.create({
      data: {
        leadId,
        type: "WHATSAPP_SENT",
        note: message.trim(),
      },
    });
  }

  return NextResponse.json({ ok: true, waMessageId: waData.messages?.[0]?.id });
}
