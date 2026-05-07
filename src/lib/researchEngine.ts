// Core lead research logic — used by the API route and the discovery pipeline

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { scoreLead } from "@/lib/pitchEngine";

export interface ResearchData {
  businessProfile: string;
  socialMedia: string;
  menuInsights: string;
  seasonalOpportunities: string;
  recommendedProducts: string;
  recipeIdeas: string;
  areaInsights: string;
  pitchAngles: string;
  quickLinks: string[];
  summary: string;
}

async function buildProductCatalog(): Promise<string> {
  const categories = await db.productCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { name: true, keyBenefits: true, targetCustomers: true, usages: true, packSize: true, moq: true },
      },
    },
  });
  return categories
    .filter((c) => c.products.length > 0)
    .map((c) => {
      const lines = c.products.map((p) => {
        const details = [
          p.keyBenefits,
          p.targetCustomers ? `Best for: ${p.targetCustomers}` : null,
          p.usages ? `Use: ${p.usages}` : null,
          p.packSize ? `Pack: ${p.packSize}` : null,
          p.moq ? `MOQ: ${p.moq}` : null,
        ].filter(Boolean).join(" | ");
        return `  • ${p.name}${details ? ` — ${details}` : ""}`;
      });
      return `${c.name} (${c.products.length} products):\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

async function webSearch(query: string): Promise<string> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return "";
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, gl: "in", num: 5 }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return (
      data.organic
        ?.map((r: { title: string; snippet: string; link: string }) => `${r.title}: ${r.snippet} (${r.link})`)
        .join("\n") ?? ""
    );
  } catch {
    return "";
  }
}

// Runs Deep Research on a lead, saves results to DB, and re-scores.
// Returns null silently if AI is not configured or lead not found.
export async function runLeadResearch(
  leadId: string,
  byName = "System"
): Promise<ResearchData | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const [lead, productCatalog] = await Promise.all([
    db.lead.findUnique({
      where: { id: leadId },
      include: { activities: { orderBy: { createdAt: "desc" }, take: 10 } },
    }),
    buildProductCatalog(),
  ]);
  if (!lead) return null;

  const location = [lead.city, lead.state].filter(Boolean).join(", ");
  const businessName = lead.businessName;
  const activitySummary = lead.activities
    .map((a) => `${a.type}: ${a.note?.slice(0, 100)}`)
    .join("\n");

  const [webResults1, webResults2] = await Promise.all([
    webSearch(`${businessName} ${location} restaurant cafe menu`),
    webSearch(`${businessName} ${location} instagram`),
  ]);
  const webContext = [webResults1, webResults2].filter(Boolean).join("\n\n");

  const today = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const systemPrompt = `You are a specialist sales research analyst for The Tea Planet — India's First Bubble Tea Manufacturer.

Your job is to research an F&B business and produce actionable intelligence for a sales rep who will pitch our products.

THE TEA PLANET — FULL PRODUCT CATALOG (live from our database):
${productCatalog}

USPs: 200%+ gross margins, no special equipment needed, go live in 7 days, FSSC 22000/FSSAI/HALAL/APEDA certified, 500+ partners across India.

Today's date: ${today}

Always respond with valid JSON only. No markdown fences.`;

  const userPrompt = `Research this F&B business and give me sales intelligence:

Business Name: ${businessName}
Location: ${location || "India"}
Owner: ${lead.ownerName ?? "Unknown"}
Notes from our team: ${lead.notes ?? "None"}
Tags: ${lead.tags?.join(", ") || "None assigned"}
Recent activities: ${activitySummary || "No activities yet"}
${webContext ? `\nWeb search results:\n${webContext}` : "\n(No web search results available — using AI knowledge)"}

Produce a JSON object with these keys:
{
  "businessProfile": "2-3 sentence profile: what type of business this likely is, their likely customer base, scale",
  "socialMedia": "Instagram handle guesses + search link, website if found, Zomato/Swiggy presence",
  "menuInsights": "What menu items they likely have. What specialty beverages would complement what they already serve well — frame as additions, not gaps",
  "seasonalOpportunities": "Given the current month (${today}), what seasonal drinks/trends would add well to their offering? Summer? Festive season? Wedding season?",
  "recommendedProducts": "Specific The Tea Planet products (use real category names and product names) that would sit naturally alongside this business's existing menu. Be specific — not generic",
  "recipeIdeas": "2-3 concrete recipe ideas using TTP products that would complement their existing menu well. E.g. 'Brown Sugar Boba Taro Shake using our Taro Premix + Brown Sugar Syrup'",
  "areaInsights": "F&B landscape in ${location || "their city"}. What's trending locally. Avg consumer spend. What similar businesses in the area are doing well with specialty beverages",
  "pitchAngles": "Top 3 respectful, growth-focused sales angles for this business. Lead with appreciation for what they've built, then suggest additions. Never frame as fixing a problem or filling a gap.",
  "quickLinks": ["Google: https://www.google.com/search?q=${encodeURIComponent(businessName + " " + location)}", "Instagram: https://www.instagram.com/${businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}", "Zomato: https://www.zomato.com/${(location || "india").toLowerCase().split(",")[0].trim().replace(/\s+/g, "-")}"],
  "summary": "2-sentence exec summary for the sales rep: what's the opportunity and what's the best opening line"
}`;

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  const research: ResearchData = JSON.parse(jsonText);

  // Persist to DB + log activity + re-score
  await Promise.all([
    db.lead.update({
      where: { id: leadId },
      data: { researchData: research as never, researchedAt: new Date() },
    }),
    db.leadActivity.create({
      data: {
        leadId,
        type: "NOTE",
        note: `🔍 Deep Research run by ${byName}. Summary: ${research.summary ?? ""}`,
      },
    }),
  ]);

  // Re-score based on fresh data
  await scoreLead(leadId);

  return research;
}
