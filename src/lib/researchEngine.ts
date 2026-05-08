import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { scoreLead } from "@/lib/pitchEngine";

export interface ResearchData {
  businessProfile: string;
  socialMedia: string;
  menuInsights: string;
  seasonalOpportunities: string;
  recommendedProducts: string;
  crossSellUpsell: string;
  recipeIdeas: string;
  areaInsights: string;
  engagementStrategy: string;
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

// Extract relationship signals from activity history
function parseRelationshipContext(activities: { type: string; note?: string | null; createdAt: Date }[], notes: string | null): {
  relationshipType: "new" | "contacted" | "existing_customer";
  purchasedProducts: string[];
  sampleHistory: string[];
  lastInteraction: string;
  keyDiscussions: string[];
} {
  const allText = [
    notes ?? "",
    ...activities.map((a) => a.note ?? ""),
  ].join(" ").toLowerCase();

  // Detect purchase signals
  const purchaseKeywords = ["ordered", "order", "purchased", "buying", "bought", "stock", "reorder", "invoice", "supply", "supplies", "delivering", "using"];
  const sampleKeywords = ["sample", "samples", "trial", "tasting", "tasted", "tried", "testing"];

  const purchasedProducts: string[] = [];
  const sampleHistory: string[] = [];

  // Extract meaningful activity notes
  const keyDiscussions = activities
    .filter((a) => a.note && a.note.length > 10)
    .slice(0, 8)
    .map((a) => {
      const date = new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      return `[${date}] ${a.type}: ${a.note?.slice(0, 150)}`;
    });

  // Detect samples from notes
  activities.forEach((a) => {
    const text = (a.note ?? "").toLowerCase();
    if (sampleKeywords.some((k) => text.includes(k))) {
      sampleHistory.push(a.note?.slice(0, 100) ?? "");
    }
    if (purchaseKeywords.some((k) => text.includes(k))) {
      purchasedProducts.push(a.note?.slice(0, 100) ?? "");
    }
  });

  // Also check main notes field
  if (notes) {
    const notesLower = notes.toLowerCase();
    if (sampleKeywords.some((k) => notesLower.includes(k))) sampleHistory.push(notes.slice(0, 100));
    if (purchaseKeywords.some((k) => notesLower.includes(k))) purchasedProducts.push(notes.slice(0, 100));
  }

  const lastInteraction = activities.length > 0
    ? `${new Date(activities[0].createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — ${activities[0].type}: ${activities[0].note?.slice(0, 80) ?? ""}`
    : "No previous contact";

  const relationshipType =
    purchasedProducts.length > 0 ? "existing_customer" :
    activities.length > 0 ? "contacted" :
    "new";

  return { relationshipType, purchasedProducts, sampleHistory, lastInteraction, keyDiscussions };
}

export async function runLeadResearch(
  leadId: string,
  byName = "System"
): Promise<ResearchData | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const [lead, productCatalog] = await Promise.all([
    db.lead.findUnique({
      where: { id: leadId },
      include: { activities: { orderBy: { createdAt: "desc" }, take: 20 } },
    }),
    buildProductCatalog(),
  ]);
  if (!lead) return null;

  const location = [lead.city, lead.state].filter(Boolean).join(", ");
  const businessName = lead.businessName;
  const relationship = parseRelationshipContext(lead.activities, lead.notes ?? null);

  const [webResults1, webResults2] = await Promise.all([
    webSearch(`${businessName} ${location} restaurant cafe menu`),
    webSearch(`${businessName} ${location} specialty beverages trending`),
  ]);
  const webContext = [webResults1, webResults2].filter(Boolean).join("\n\n");
  const today = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  // Build relationship context block for the prompt
  const relationshipBlock = `
RELATIONSHIP STATUS: ${
    relationship.relationshipType === "existing_customer" ? "Existing Customer — they are already buying from us" :
    relationship.relationshipType === "contacted" ? "Previously Contacted — we have spoken before but no purchase yet" :
    "New Lead — no prior contact"
  }

${relationship.purchasedProducts.length > 0 ? `WHAT THEY ALREADY BUY FROM US:\n${relationship.purchasedProducts.join("\n")}` : ""}
${relationship.sampleHistory.length > 0 ? `\nSAMPLE HISTORY:\n${relationship.sampleHistory.join("\n")}` : ""}
${relationship.keyDiscussions.length > 0 ? `\nINTERACTION HISTORY (most recent first):\n${relationship.keyDiscussions.join("\n")}` : ""}
${lead.notes ? `\nTEAM NOTES: ${lead.notes}` : ""}
`.trim();

  const systemPrompt = `You are a senior sales intelligence analyst for The Tea Planet — India's First Bubble Tea Manufacturer, since 2011.

THE TEA PLANET — FULL PRODUCT CATALOG:
${productCatalog}

USPs: 200%+ gross margins per cup, no new equipment needed, live in 7 days, FSSC 22000/FSSAI/HALAL/APEDA certified, 500+ partners across India.

Today: ${today}

Your job is to produce a precise sales intelligence briefing that the rep will use BEFORE reaching out. The briefing must account for:
- Where this business is in the relationship (new, contacted, existing customer)
- What they already buy (cross-sell/upsell opportunities, not re-pitching what they have)
- What samples were sent or discussed (follow up on those specifically)
- What's trending in their area right now
- How to engage their curiosity without giving everything away upfront

Respond with valid JSON only. No markdown fences.`;

  const userPrompt = `Produce a sales intelligence briefing for this F&B business:

BUSINESS: ${businessName}
LOCATION: ${location || "India"}
OWNER: ${lead.ownerName ?? "Unknown"}
TAGS: ${lead.tags?.join(", ") || "None"}

${relationshipBlock}
${webContext ? `\nWEB INTELLIGENCE:\n${webContext}` : "\n(No web data — use category knowledge)"}

Return this JSON:
{
  "businessProfile": "2-3 sentences: business type, likely customer profile, scale, what makes them worth pursuing",

  "socialMedia": "Instagram/online presence — handle guesses, Zomato/Swiggy listing, website if found",

  "menuInsights": "What they likely serve. What specialty beverages would sit naturally alongside their current menu. Be specific to their business type.",

  "seasonalOpportunities": "What's relevant right now in ${today} for this specific business — summer drinks, festive menus, wedding catering, etc.",

  "recommendedProducts": "${relationship.relationshipType === "existing_customer"
    ? "They already buy from us. Focus ONLY on cross-sell and upsell — products they don't have yet that pair with what they already take. Explain the specific pairing logic."
    : relationship.relationshipType === "contacted"
    ? "They've been contacted but haven't bought. Identify 2-3 products most likely to get them to say yes based on their business type and what was discussed."
    : "2-3 products from our catalog that fit this business best. Be specific — not generic category names."
  }",

  "crossSellUpsell": "${relationship.relationshipType === "existing_customer"
    ? "Concrete cross-sell and upsell path: what they have → what they should add next and why. Include margin and revenue angle."
    : relationship.sampleHistory.length > 0
    ? "They've had samples. What's the natural next step — which product do we convert them on first and what's the upsell path from there?"
    : "What's the entry product that gets them started, and what does the 6-month growth path look like once they're in."
  }",

  "recipeIdeas": "2-3 specific recipe ideas using our products tailored to their menu. Format: 'Recipe name using [TTP product]' with one line on why it works for their customers.",

  "areaInsights": "What's trending in ${location || "their city"} right now for F&B. What are similar businesses doing well with specialty beverages. Avg consumer spend. Any local event or seasonal angle.",

  "engagementStrategy": "${relationship.relationshipType === "existing_customer"
    ? "How to approach for cross-sell: acknowledge their success with current products first, introduce the new angle as a natural next step. What specific hook opens the conversation."
    : relationship.sampleHistory.length > 0
    ? "They have samples. Don't ask if they tried it — instead open with market intelligence about what's selling, let them bring up the samples. What's the specific hook."
    : "How to open the conversation to build curiosity without revealing all our cards. What market observation or local trend do we lead with? What's the one thing we say that makes them want to know more?"
  }",

  "quickLinks": [
    "Google: https://www.google.com/search?q=${encodeURIComponent(businessName + " " + location)}",
    "Instagram: https://www.instagram.com/${businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}",
    "Zomato: https://www.zomato.com/${(location || "india").toLowerCase().split(",")[0].trim().replace(/\s+/g, "-")}"
  ],

  "summary": "2 sentences for the sales rep: the specific opportunity here and the one opening line that will get a response — based on what we know about this business and this relationship stage."
}`;

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let research: ResearchData;
  try {
    research = JSON.parse(jsonText);
  } catch {
    research = {
      businessProfile: rawText.slice(0, 500),
      socialMedia: "", menuInsights: "", seasonalOpportunities: "",
      recommendedProducts: "", crossSellUpsell: "", recipeIdeas: "",
      areaInsights: "", engagementStrategy: "",
      quickLinks: [],
      summary: "Research completed but response could not be parsed. Raw content shown in Business Profile.",
    };
  }

  await Promise.all([
    db.lead.update({
      where: { id: leadId },
      data: { researchData: research as never, researchedAt: new Date() },
    }),
    db.leadActivity.create({
      data: {
        leadId,
        type: "NOTE",
        note: `Deep Research run by ${byName}. ${research.summary ?? ""}`,
      },
    }),
  ]);

  await scoreLead(leadId);
  return research;
}
