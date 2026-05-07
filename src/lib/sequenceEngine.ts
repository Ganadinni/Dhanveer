// WhatsApp sequence drip engine — processes due enrollments and sends messages

import { db } from "@/lib/db";

const GRAPH_URL = "https://graph.facebook.com/v19.0";

function renderTemplate(template: string, vars: { name: string; business: string; city: string }): string {
  return template
    .replace(/\{name\}/g, vars.name)
    .replace(/\{business\}/g, vars.business)
    .replace(/\{city\}/g, vars.city);
}

async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_API_TOKEN;
  if (!phoneNumberId || !token) return false;

  const phone = to.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    }),
  });
  return res.ok;
}

// Enroll a lead in a sequence. Calculates nextSendAt from step 0's delayDays.
export async function enrollLead(leadId: string, sequenceId: string): Promise<void> {
  const sequence = await db.whatsAppSequence.findUnique({
    where: { id: sequenceId },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });
  if (!sequence || !sequence.isActive || sequence.steps.length === 0) return;

  const firstStep = sequence.steps[0];
  const enrolledAt = new Date();
  const nextSendAt = new Date(enrolledAt);
  nextSendAt.setDate(nextSendAt.getDate() + firstStep.delayDays);

  await db.leadSequenceEnrollment.upsert({
    where: { leadId_sequenceId: { leadId, sequenceId } },
    create: { leadId, sequenceId, currentStep: 0, enrolledAt, nextSendAt, status: "ACTIVE" },
    update: { currentStep: 0, enrolledAt, nextSendAt, status: "ACTIVE", lastSentAt: null },
  });
}

// Process all due enrollments — called by cron
export async function processDueSequences(): Promise<{ sent: number; errors: number }> {
  const now = new Date();
  let sent = 0;
  let errors = 0;

  const dueEnrollments = await db.leadSequenceEnrollment.findMany({
    where: { status: "ACTIVE", nextSendAt: { lte: now } },
    include: {
      lead: { select: { id: true, businessName: true, ownerName: true, phone: true, city: true } },
      sequence: { include: { steps: { orderBy: { stepNumber: "asc" } } } },
    },
  });

  for (const enrollment of dueEnrollments) {
    const { lead, sequence } = enrollment;
    if (!lead.phone) {
      await advanceOrComplete(
        { id: enrollment.id, currentStep: enrollment.currentStep, enrolledAt: enrollment.enrolledAt },
        sequence.steps,
        now
      );
      continue;
    }

    const step = sequence.steps[enrollment.currentStep];
    if (!step) {
      await db.leadSequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "COMPLETED" },
      });
      continue;
    }

    const firstName = lead.ownerName?.split(" ")[0] ?? "there";
    const message = renderTemplate(step.message, {
      name: firstName,
      business: lead.businessName,
      city: lead.city ?? "your city",
    });

    const ok = await sendWhatsApp(lead.phone, message).catch(() => false);
    if (ok) {
      await db.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "WHATSAPP_SENT",
          note: `[Sequence: ${sequence.name} — Step ${step.stepNumber + 1}]\n${message}`,
        },
      });
      await advanceOrComplete(
        { id: enrollment.id, currentStep: enrollment.currentStep, enrolledAt: enrollment.enrolledAt },
        sequence.steps,
        now
      );
      sent++;
    } else {
      errors++;
    }
  }

  return { sent, errors };
}

async function advanceOrComplete(
  enrollment: { id: string; currentStep: number; enrolledAt: Date },
  steps: Array<{ delayDays: number }>,
  now: Date
) {
  const nextIndex = enrollment.currentStep + 1;
  const nextStep = steps[nextIndex];

  if (!nextStep) {
    await db.leadSequenceEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "COMPLETED", lastSentAt: now, nextSendAt: null },
    });
    return;
  }

  const nextSendAt = new Date(enrollment.enrolledAt);
  nextSendAt.setDate(nextSendAt.getDate() + nextStep.delayDays);

  await db.leadSequenceEnrollment.update({
    where: { id: enrollment.id },
    data: { currentStep: nextIndex, lastSentAt: now, nextSendAt },
  });
}
