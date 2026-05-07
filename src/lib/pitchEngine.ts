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
  const firstName = ownerName.split(" ")[0];

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

  const systemPrompt = `You are a senior sales executive at The Tea Planet — India's First Bubble Tea Manufacturer (Est. 2011, Hyderabad).

Key facts to weave naturally into pitches:
- India's First and Most Trusted Bubble Tea Manufacturer since 2011
- 200%+ gross margins on every drink served
- "Go Live in 7 Days" — full support, training, recipes
- "Stop comparing price per kg. Compare cost per cup." (our USP positioning)
- Certifications: FSSC 22000, FSSAI, HALAL certified, APEDA, FDA Registered, Tea Board India, Coffee Board
- 8 dedicated production lines in Hyderabad
- Direct tea sourcing: Assam, West Bengal, Tamil Nadu, Kerala, Sri Lanka
- 500+ partners across cafes, hotels, QSRs, cloud kitchens
- 200+ recipes, no special equipment needed
- Phone: +91-8886277713 | Website: www.theteaplanet.com

Write in a warm, professional Indian business tone. Be specific to the business type. Never sound generic.`;

  const userPrompt = `Write a personalised sales pitch for this lead:

Business: ${lead.businessName}
Owner: ${ownerName}${location ? `\nLocation: ${location}` : ""}${lead.notes ? `\nNotes: ${lead.notes}` : ""}

OUR FULL PRODUCT CATALOG (choose the 4 best matches for this specific business):
${catalogText}

Generate THREE things:
1. Select the 4 most relevant products for this business and list them with a specific reason why each fits them.
2. A professional EMAIL PITCH — subject line + email body. Reference their specific business type, mention 2–3 of the selected products by exact name with their key benefit. Close with a free sample kit offer.
3. A WHATSAPP MESSAGE — casual, punchy, under 180 words. Use *bold* for emphasis, 3–4 emojis, end with "Reply YES for a free sample kit!". Address them as ${firstName}.

Respond ONLY with valid JSON in this exact structure (no markdown, no explanation outside JSON):
{
  "selectedProducts": [
    { "name": "exact product name from catalog", "sku": "sku or null", "category": "category name", "reason": "specific reason for this business" }
  ],
  "subject": "email subject line here",
  "pitch": "full email body here (use \\n for line breaks)",
  "whatsappMessage": "whatsapp message here (use \\n for line breaks)"
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
    .map((p, i) => `${i + 1}. **${p.name}**${p.sku ? ` (${p.sku})` : ""}\n   ${p.reason}${p.dealerPrice ? `\n   Dealer price: ₹${p.dealerPrice}${p.moq ? ` · MOQ: ${p.moq}` : ""}` : ""}`)
    .join("\n\n");

  const pitch = `Dear ${firstName},

Greetings from **The Tea Planet** — India's First Bubble Tea Manufacturer (Est. 2011)!

We noticed that **${lead.businessName}**${location ? ` in ${location}` : ""} is in the F&B/hospitality space, and we believe our products can add significant value to your menu and margins.

**Why The Tea Planet?**
- India's First and Most Trusted Bubble Tea Manufacturer since 2011
- **200%+ gross margins** on every drink you serve
- Launch a complete beverage menu in just **7 days** — we handle training and setup
- No special equipment needed — just add water and serve
- Certifications: FSSC 22000 · FSSAI · HALAL · APEDA · FDA Registered

**Products we recommend for ${lead.businessName}:**

${productLines}

💡 **Stop comparing price per kg. Start comparing cost per cup.**
Our premixes deliver a cost per cup of ₹8–15, while you sell at ₹80–150.

We'd love to arrange a **free sample kit** — no commitment, just taste the difference!

Warm regards,
The Tea Planet Sales Team
📞 +91-8886277713 | 🌐 www.theteaplanet.com`;

  const subject = `Free Sample Kit for ${lead.businessName} — 200%+ Margin Beverages | The Tea Planet`;

  const prodList = recommended.slice(0, 3).map((p) => `• ${p.name}`).join("\n");
  const whatsappMessage = `Hi ${firstName}! 👋

I'm reaching out from *The Tea Planet* — India's First Bubble Tea Manufacturer (Est. 2011) 🏆

We help businesses like *${lead.businessName}*${location ? ` in ${location}` : ""} launch high-margin beverage menus in just *7 days*!

${prodList}

💰 *200%+ gross margin* on every cup · No special equipment needed
✅ FSSC 22000 · FSSAI · HALAL certified

Reply *YES* for a FREE sample kit delivered to your door! 🚀

_The Tea Planet | +91-8886277713 | www.theteaplanet.com_`;

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
