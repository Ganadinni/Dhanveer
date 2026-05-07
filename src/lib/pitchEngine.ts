// Pitch generation engine — uses Claude AI + product knowledge base for personalised pitches
// Falls back to template generation if ANTHROPIC_API_KEY is not configured.

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

interface Lead {
  businessName: string;
  ownerName?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
}

interface PitchResult {
  subject: string;
  pitch: string;
  recommendedProducts: RecommendedProduct[];
  whatsappMessage: string;
}

interface RecommendedProduct {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  reason: string;
  mrp: number | null;
  dealerPrice: number | null;
  moq: string | null;
}

// Keyword → product category affinity map
const CUSTOMER_SIGNALS: Record<string, string[]> = {
  cafe: ["Beverage Premixes", "Popping Boba", "Tapioca Pearls", "Syrups & Bases"],
  boba: ["Beverage Premixes", "Popping Boba", "Tapioca Pearls", "Syrups & Bases"],
  bubble: ["Beverage Premixes", "Popping Boba", "Tapioca Pearls", "Syrups & Bases"],
  tea: ["Beverage Premixes", "Tea Concentrates", "Syrups & Bases"],
  qsr: ["Beverage Premixes", "Milkshake & Lassi Mixes", "Mocktail & Lemonade Mixes"],
  chain: ["Beverage Premixes", "Industrial Ingredients", "Tapioca Pearls"],
  franchise: ["Beverage Premixes", "Industrial Ingredients", "Popping Boba"],
  restaurant: ["Beverage Premixes", "Mocktail & Lemonade Mixes", "Tea Concentrates"],
  hotel: ["Beverage Premixes", "Tea Concentrates", "Mocktail & Lemonade Mixes"],
  resort: ["Beverage Premixes", "Mocktail & Lemonade Mixes", "Syrups & Bases"],
  hospitality: ["Beverage Premixes", "Tea Concentrates", "Mocktail & Lemonade Mixes"],
  coffee: ["Beverage Premixes", "Syrups & Bases"],
  bar: ["Mocktail & Lemonade Mixes", "Syrups & Bases", "Popping Boba"],
  mocktail: ["Mocktail & Lemonade Mixes", "Syrups & Bases"],
  lounge: ["Mocktail & Lemonade Mixes", "Syrups & Bases", "Beverage Premixes"],
  dessert: ["Boba Desserts", "Popping Boba", "Beverage Premixes"],
  bakery: ["Boba Desserts", "Beverage Premixes", "Milkshake & Lassi Mixes"],
  cake: ["Boba Desserts", "Syrups & Bases"],
  sweet: ["Milkshake & Lassi Mixes", "Boba Desserts", "Popping Boba"],
  mithai: ["Milkshake & Lassi Mixes", "Boba Desserts"],
  ice: ["Milkshake & Lassi Mixes", "Popping Boba", "Syrups & Bases"],
  juice: ["Mocktail & Lemonade Mixes", "Syrups & Bases", "Beverage Premixes"],
  fruit: ["Mocktail & Lemonade Mixes", "Syrups & Bases"],
  lemonade: ["Mocktail & Lemonade Mixes", "Syrups & Bases"],
  office: ["Beverage Premixes", "Tea Concentrates"],
  canteen: ["Beverage Premixes", "Milkshake & Lassi Mixes"],
  corporate: ["Beverage Premixes", "Tea Concentrates"],
  hospital: ["Beverage Premixes", "Tea Concentrates"],
  airport: ["Beverage Premixes", "Tea Concentrates"],
  dhaba: ["Beverage Premixes", "Tea Concentrates"],
  college: ["Beverage Premixes", "Milkshake & Lassi Mixes", "Mocktail & Lemonade Mixes"],
  school: ["Beverage Premixes", "Milkshake & Lassi Mixes"],
  multiplex: ["Beverage Premixes", "Milkshake & Lassi Mixes", "Popping Boba"],
  event: ["Mocktail & Lemonade Mixes", "Beverage Premixes", "Popping Boba"],
  catering: ["Mocktail & Lemonade Mixes", "Beverage Premixes", "Industrial Ingredients"],
  wedding: ["Mocktail & Lemonade Mixes", "Milkshake & Lassi Mixes", "Boba Desserts"],
  party: ["Mocktail & Lemonade Mixes", "Popping Boba", "Boba Desserts"],
  festival: ["Mocktail & Lemonade Mixes", "Beverage Premixes", "Popping Boba"],
  startup: ["Beverage Premixes", "Popping Boba", "Tapioca Pearls", "Syrups & Bases"],
  cloud: ["Beverage Premixes", "Milkshake & Lassi Mixes", "Mocktail & Lemonade Mixes"],
  kitchen: ["Beverage Premixes", "Milkshake & Lassi Mixes"],
  delivery: ["Beverage Premixes", "Milkshake & Lassi Mixes", "Mocktail & Lemonade Mixes"],
  zomato: ["Beverage Premixes", "Milkshake & Lassi Mixes"],
  swiggy: ["Beverage Premixes", "Milkshake & Lassi Mixes"],
  distributor: ["Industrial Ingredients", "Beverage Premixes", "Popping Boba"],
  wholesale: ["Industrial Ingredients", "Tapioca Pearls", "Popping Boba"],
  wellness: ["Beverage Premixes", "Tea Concentrates"],
  yoga: ["Beverage Premixes", "Tea Concentrates"],
  gym: ["Milkshake & Lassi Mixes", "Beverage Premixes"],
  ayurvedic: ["Beverage Premixes", "Tea Concentrates"],
  pharmacy: ["Beverage Premixes", "Tea Concentrates"],
  lassi: ["Milkshake & Lassi Mixes"],
  milkshake: ["Milkshake & Lassi Mixes", "Beverage Premixes"],
  punjabi: ["Milkshake & Lassi Mixes", "Beverage Premixes"],
};

function detectCategories(text: string): string[] {
  const lower = text.toLowerCase();
  const matched = new Set<string>();
  for (const [keyword, cats] of Object.entries(CUSTOMER_SIGNALS)) {
    if (lower.includes(keyword)) cats.forEach((c) => matched.add(c));
  }
  return matched.size > 0 ? Array.from(matched) : ["Beverage Premixes", "Popping Boba"];
}

export async function generatePitch(lead: Lead): Promise<PitchResult> {
  // Fetch full catalog from DB — single source of truth
  const allProducts = await db.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await generateWithClaude(lead, allProducts);
    } catch {
      // Fall through to template on any AI error
    }
  }

  // Template fallback: use keyword-matching to pick products
  const searchText = [lead.businessName, lead.ownerName, lead.notes].filter(Boolean).join(" ");
  const targetCategories = detectCategories(searchText);
  const matched = allProducts.filter((p) => targetCategories.includes(p.category.name));
  const fallbackProducts = matched.length > 0 ? matched : allProducts;
  const recommended: RecommendedProduct[] = fallbackProducts.slice(0, 4).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category.name,
    reason: deriveReason(p.keyBenefits ?? "", lead.businessName),
    mrp: p.mrp,
    dealerPrice: p.dealerPrice,
    moq: p.moq,
  }));
  return generateFromTemplate(lead, recommended);
}

async function generateWithClaude(
  lead: Lead,
  allProducts: Array<{ id: string; name: string; sku: string | null; category: { name: string }; keyBenefits: string | null; targetCustomers: string | null; usages: string | null; mrp: number | null; dealerPrice: number | null; moq: string | null; packSize: string | null }>
): Promise<PitchResult> {
  const client = new Anthropic();
  const location = [lead.city, lead.state].filter(Boolean).join(", ");
  const ownerName = lead.ownerName ?? "Sir/Ma'am";

  // Build full catalog grouped by category for Claude to reason over
  const byCategory: Record<string, typeof allProducts> = {};
  for (const p of allProducts) {
    (byCategory[p.category.name] ??= []).push(p);
  }
  const catalogText = Object.entries(byCategory)
    .map(([cat, prods]) => {
      const lines = prods.map((p) => {
        const details = [
          p.keyBenefits,
          p.targetCustomers ? `Best for: ${p.targetCustomers}` : null,
          p.dealerPrice ? `Dealer: ₹${p.dealerPrice}${p.moq ? `, MOQ: ${p.moq}` : ""}` : null,
          p.packSize ? `Pack: ${p.packSize}` : null,
        ].filter(Boolean).join(" | ");
        return `  • ${p.name}${p.sku ? ` [${p.sku}]` : ""}${details ? ` — ${details}` : ""}`;
      });
      return `${cat}:\n${lines.join("\n")}`;
    })
    .join("\n\n");

  const systemPrompt = `You are a senior sales professional at The Tea Planet who has personally visited and won over hundreds of F&B businesses across India. You understand their world — the pressure to keep customers coming back, menu fatigue, the constant search for something that sells itself.

About The Tea Planet:
- India's first bubble tea manufacturer, since 2011, based in Hyderabad
- 200%+ gross margins — a cup that costs 12 rupees to make sells for 100-150
- No new equipment needed, live in 7 days, full recipe support
- FSSC 22000, FSSAI, HALAL, APEDA certified — safe to say yes to any client
- 500+ partners: from small cafes to five-star hotels to QSR chains
- Direct tea sourcing from Assam, Darjeeling, Kerala, Sri Lanka
- Phone: +91-8886277713 | www.theteaplanet.com

Writing rules — follow without exception:
- No markdown. No asterisks, no hashtags, no dashes as bullets. Plain flowing text only.
- No emojis in emails. WhatsApp can have one or two if they fit the tone — nothing celebratory or salesy.
- Never open with "I hope this email finds you well" or any variation.
- Don't name the product first — describe what changes for their customer and their margins.
- Create a specific tension: what gap in their menu are they sitting on? What are similar businesses in their city already doing?
- Sound like someone who walked into their place, looked around, and formed a specific opinion.
- Email: three tight paragraphs. Subject line should read like a thought, not an ad. No sign-off clichés.
- WhatsApp: under 140 words. Peer-to-peer, not pitch-to-prospect. One specific observation, one easy ask.
- Close with something concrete and low-effort for them: "I can courier three samples to your place this week, no paperwork."`;

  const userPrompt = `Write a personalised outreach for this F&B business:

Business: ${lead.businessName}
Owner: ${ownerName}${location ? `\nLocation: ${location}` : ""}${lead.notes ? `\nContext: ${lead.notes}` : ""}

Our product catalog — pick the 4 that genuinely fit this business, not the most popular ones:
${catalogText}

Respond ONLY with valid JSON, no markdown, no text outside the JSON:
{
  "selectedProducts": [
    { "name": "exact name from catalog above", "sku": "sku or null", "category": "category name", "reason": "one specific sentence on why this fits their business" }
  ],
  "subject": "email subject — reads like a thought, not an ad",
  "pitch": "email body — three paragraphs, plain text, no formatting (use \\n for line breaks)",
  "whatsappMessage": "whatsapp message — peer tone, under 140 words, 0-1 emoji (use \\n for line breaks)"
}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonText = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  const parsed = JSON.parse(jsonText);

  // Map Claude's selected products back to DB records for pricing info
  const productMap = new Map(allProducts.map((p) => [p.name.toLowerCase(), p]));
  const recommended: RecommendedProduct[] = (parsed.selectedProducts ?? []).slice(0, 4).map(
    (sp: { name: string; sku: string | null; category: string; reason: string }) => {
      const dbProduct = productMap.get(sp.name.toLowerCase());
      return {
        id: dbProduct?.id ?? sp.name,
        name: sp.name,
        sku: dbProduct?.sku ?? sp.sku ?? null,
        category: sp.category,
        reason: sp.reason,
        mrp: dbProduct?.mrp ?? null,
        dealerPrice: dbProduct?.dealerPrice ?? null,
        moq: dbProduct?.moq ?? null,
      };
    }
  );

  return {
    subject: parsed.subject ?? `Partnership Opportunity for ${lead.businessName}`,
    pitch: parsed.pitch ?? "",
    recommendedProducts: recommended,
    whatsappMessage: parsed.whatsappMessage ?? "",
  };
}

function generateFromTemplate(lead: Lead, recommended: RecommendedProduct[]): PitchResult {
  const ownerName = lead.ownerName ?? "Sir/Ma'am";
  const firstName = ownerName.split(" ")[0];
  const location = [lead.city, lead.state].filter(Boolean).join(", ");

  const productLines = recommended
    .map((p) => `${p.name}${p.sku ? ` (${p.sku})` : ""} — ${p.reason}${p.dealerPrice ? ` Dealer: Rs.${p.dealerPrice}${p.moq ? `, MOQ: ${p.moq}` : ""}` : ""}`)
    .join("\n");

  const pitch = `Dear ${firstName},

The beverage category is quietly becoming the highest-margin line on any F&B menu — and most businesses in ${location || "your area"} are only scratching the surface of what's possible. At The Tea Planet, we've been helping cafes and restaurants like yours add 200%+ margin drinks to their menu since 2011, without any new equipment or a long ramp-up time.

What we'd suggest for ${lead.businessName}: ${productLines}

Each of these can be ready to serve within a week. The cost per cup runs between Rs.8 and Rs.15. The selling price is yours to set — most of our partners charge Rs.80 to Rs.150. We'll courier a sample kit to your address this week with no paperwork. If you like what you taste, we go from there.

The Tea Planet | +91-8886277713 | www.theteaplanet.com`;

  const subject = `A beverage idea for ${lead.businessName}`;

  const prodList = recommended.slice(0, 3).map((p) => p.name).join(", ");
  const whatsappMessage = `Hi ${firstName},

Came across ${lead.businessName}${location ? ` in ${location}` : ""} and wanted to share something. We work with cafes and restaurants on adding high-margin beverages to their menu — things like ${prodList}. Cost per cup is under Rs.15, selling price is typically Rs.80-150.

No equipment needed, ready to serve in a week. Happy to courier samples to your place.

The Tea Planet — +91-8886277713`;

  return { subject, pitch, recommendedProducts: recommended, whatsappMessage };
}

function deriveReason(keyBenefits: string, businessName: string): string {
  if (!keyBenefits) return `Perfect fit for ${businessName}`;
  const parts = keyBenefits.split(",").map((s) => s.trim());
  return parts.slice(0, 2).join(" · ") || keyBenefits.slice(0, 100);
}

export async function scoreLead(leadId: string): Promise<void> {
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: {
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      tasks: { where: { completed: true } },
    },
  });
  if (!lead) return;

  const searchText = [lead.businessName, lead.notes].filter(Boolean).join(" ").toLowerCase();
  const signalMatches = Object.keys(CUSTOMER_SIGNALS).filter((k) => searchText.includes(k)).length;
  const fitScore = Math.min(100, signalMatches * 12 + (lead.phone ? 10 : 0) + (lead.email ? 10 : 0));

  const activityCount = lead.activities.length;
  const engageScore = Math.min(100, activityCount * 12);

  const STATUS_INTENT: Record<string, number> = {
    NEW: 10, CONTACTED: 30, QUALIFIED: 55, PROPOSAL_SENT: 70, NEGOTIATION: 85, WON: 100, LOST: 0,
  };
  const intentScore = STATUS_INTENT[lead.status] ?? 10;

  const score = Math.round((fitScore * 0.35) + (engageScore * 0.3) + (intentScore * 0.35));
  const tier = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD";

  const reasoning = [
    fitScore >= 30 ? "Strong business type match for TTP products" : "Generic business type",
    engageScore >= 30 ? `Active engagement (${activityCount} activities)` : "Limited engagement so far",
    intentScore >= 55 ? "High buying intent (pipeline stage)" : intentScore >= 30 ? "Mid-funnel prospect" : "Early stage lead",
  ].join(" · ");

  await db.leadScore.upsert({
    where: { leadId },
    update: { score, tier, fitScore, engageScore, intentScore, reasoning, lastScoredAt: new Date() },
    create: { leadId, score, tier, fitScore, engageScore, intentScore, reasoning },
  });
}
