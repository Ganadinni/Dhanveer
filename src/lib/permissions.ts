// Feature permission helpers
// ADMIN role bypasses all checks. Other roles rely on the user.permissions array.
// SALES users implicitly have manage_leads (backward-compat default).

import { db } from "@/lib/db";

export const FEATURES = [
  { key: "ai_pitch",      label: "AI Pitch & Scoring",        description: "Generate AI sales pitches and score leads" },
  { key: "deep_research", label: "Deep Research (AI + Web)",  description: "Research leads online using AI before scoring" },
  { key: "whatsapp",      label: "WhatsApp Messaging",        description: "Send WhatsApp messages to leads" },
  { key: "send_email",    label: "Send Email",                description: "Send emails to leads and view email history" },
  { key: "manage_leads",  label: "Manage Leads",              description: "Create, edit and import leads" },
  { key: "delete_leads",  label: "Delete Leads",              description: "Permanently delete lead records" },
] as const;

export type FeatureKey = (typeof FEATURES)[number]["key"];

export async function userHasPermission(userId: string, role: string, feature: FeatureKey): Promise<boolean> {
  if (role === "ADMIN") return true;
  // SALES implicitly has manage_leads for backward compatibility
  if (role === "SALES" && feature === "manage_leads") return true;
  const user = await db.user.findUnique({ where: { id: userId }, select: { permissions: true } });
  return user?.permissions.includes(feature) ?? false;
}
