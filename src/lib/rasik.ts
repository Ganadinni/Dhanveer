// Rasik integration service — handles bidirectional communication with the Rasik system
// Rasik is The Tea Planet's customer-facing chatbot/conversational commerce system.
// Dhanveer (CRM) ↔ Rasik (Chatbot) share lead data, conversation history, and trigger events.

import { db } from "@/lib/db";

interface RasikLead {
  rasikId?: string;
  businessName: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  notes?: string;
  source?: string;
}

interface RasikEventPayload {
  eventType: string;
  rasikRef?: string;
  phone?: string;
  email?: string;
  leadData?: RasikLead;
  message?: string;
  productIds?: string[];
  [key: string]: unknown;
}

async function getConfig() {
  return db.rasikConfig.findFirst({ where: { enabled: true } });
}

// Call Rasik's API (Dhanveer → Rasik)
export async function callRasik(path: string, body: unknown) {
  const config = await getConfig();
  if (!config) throw new Error("Rasik not configured");

  const res = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "x-source": "dhanveer",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Rasik API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Notify Rasik that a lead's status changed
export async function notifyLeadUpdate(leadId: string, newStatus: string) {
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return;

    await callRasik("/api/dhanveer/lead-update", {
      leadId,
      phone: lead.phone,
      businessName: lead.businessName,
      newStatus,
    });
  } catch {
    // Non-critical — Rasik may be down
  }
}

// Notify Rasik to send a WhatsApp template message
export async function triggerRasikMessage(leadId: string, templateName: string, variables: string[] = []) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead?.phone) throw new Error("Lead has no phone number");

  return callRasik("/api/dhanveer/trigger-message", {
    phone: lead.phone,
    leadId,
    templateName,
    variables,
  });
}

// Process an incoming event from Rasik (Rasik → Dhanveer)
export async function processRasikEvent(payload: RasikEventPayload): Promise<void> {
  const { eventType, phone, leadData } = payload;

  // Find existing lead by phone
  let lead = phone
    ? await db.lead.findFirst({ where: { phone: { equals: phone } } })
    : null;

  // Auto-create lead if Rasik sends a new contact
  if (!lead && leadData?.businessName) {
    lead = await db.lead.create({
      data: {
        businessName: leadData.businessName,
        ownerName: leadData.ownerName ?? null,
        phone: phone ?? leadData.phone ?? null,
        email: leadData.email ?? null,
        city: leadData.city ?? null,
        state: leadData.state ?? null,
        notes: leadData.notes ?? null,
        source: "WHATSAPP",
        status: "NEW",
      },
    });

    await db.leadActivity.create({
      data: { leadId: lead.id, type: "NOTE", note: `Lead auto-created from Rasik event: ${eventType}` },
    });
  }

  // Store the Rasik event
  if (lead) {
    await db.rasikEvent.create({
      data: {
        eventType,
        rasikRef: payload.rasikRef ?? null,
        leadId: lead.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: payload as any,
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  // Handle specific event types
  switch (eventType) {
    case "LEAD_QUALIFIED":
      if (lead) {
        await db.lead.update({ where: { id: lead.id }, data: { status: "QUALIFIED" } });
        await db.leadActivity.create({
          data: { leadId: lead.id, type: "NOTE", note: "Lead qualified via Rasik conversation" },
        });
      }
      break;

    case "PRODUCT_ENQUIRY":
      if (lead && payload.message) {
        await db.leadActivity.create({
          data: {
            leadId: lead.id,
            type: "WHATSAPP_RECEIVED",
            note: `Product enquiry via Rasik: ${payload.message}`,
          },
        });
      }
      break;

    case "ORDER_PLACED":
      if (lead) {
        await db.lead.update({ where: { id: lead.id }, data: { status: "WON" } });
        await db.leadActivity.create({
          data: {
            leadId: lead.id,
            type: "NOTE",
            note: `Order placed via Rasik. Ref: ${payload.rasikRef ?? "N/A"}`,
          },
        });
      }
      break;

    case "CHAT_ENDED":
      if (lead && payload.message) {
        await db.leadActivity.create({
          data: {
            leadId: lead.id,
            type: "WHATSAPP_RECEIVED",
            note: `Rasik conversation summary: ${payload.message}`,
          },
        });
      }
      break;
  }
}
