// Pitch generation engine — uses product knowledge base to build personalised pitches
// Works without external AI APIs by using template-based intelligence from the knowledge base

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

// Keyword → product category affinity (maps business type signals to relevant product categories)
const CUSTOMER_SIGNALS: Record<string, string[]> = {
  // Bubble tea / boba focused
  cafe: ["Beverage Premixes", "Popping Boba", "Tapioca Pearls", "Syrups & Bases"],
  boba: ["Beverage Premixes", "Popping Boba", "Tapioca Pearls", "Syrups & Bases"],
  bubble: ["Beverage Premixes", "Popping Boba", "Tapioca Pearls", "Syrups & Bases"],
  "bubble tea": ["Beverage Premixes", "Popping Boba", "Tapioca Pearls"],
  tea: ["Beverage Premixes", "Tea Concentrates", "Syrups & Bases"],

  // QSR / fast food
  qsr: ["Beverage Premixes", "Milkshake & Lassi Mixes", "Mocktail & Lemonade Mixes"],
  chain: ["Beverage Premixes", "Industrial Ingredients", "Tapioca Pearls"],
  franchise: ["Beverage Premixes", "Industrial Ingredients", "Popping Boba"],
  restaurant: ["Beverage Premixes", "Mocktail & Lemonade Mixes", "Tea Concentrates"],

  // Hotel / hospitality
  hotel: ["Beverage Premixes", "Tea Concentrates", "Mocktail & Lemonade Mixes"],
  resort: ["Beverage Premixes", "Mocktail & Lemonade Mixes", "Syrups & Bases"],
  hospitality: ["Beverage Premixes", "Tea Concentrates", "Mocktail & Lemonade Mixes"],

  // Coffee shops
  coffee: ["Beverage Premixes", "Syrups & Bases"],

  // Bars / cocktails
  bar: ["Mocktail & Lemonade Mixes", "Syrups & Bases", "Popping Boba"],
  mocktail: ["Mocktail & Lemonade Mixes", "Syrups & Bases"],
  lounge: ["Mocktail & Lemonade Mixes", "Syrups & Bases", "Beverage Premixes"],

  // Dessert focused
  dessert: ["Boba Desserts", "Popping Boba", "Beverage Premixes"],
  bakery: ["Boba Desserts", "Beverage Premixes", "Milkshake & Lassi Mixes"],
  cake: ["Boba Desserts", "Syrups & Bases"],
  sweet: ["Milkshake & Lassi Mixes", "Boba Desserts", "Popping Boba"],
  mithai: ["Milkshake & Lassi Mixes", "Boba Desserts"],
  ice: ["Milkshake & Lassi Mixes", "Popping Boba", "Syrups & Bases"],

  // Juice / fruit drinks
  juice: ["Mocktail & Lemonade Mixes", "Syrups & Bases", "Beverage Premixes"],
  fruit: ["Mocktail & Lemonade Mixes", "Syrups & Bases"],
  lemonade: ["Mocktail & Lemonade Mixes", "Syrups & Bases"],

  // Institutional / corporate
  office: ["Beverage Premixes", "Tea Concentrates"],
  canteen: ["Beverage Premixes", "Milkshake & Lassi Mixes"],
  corporate: ["Beverage Premixes", "Tea Concentrates"],
  hospital: ["Beverage Premixes", "Tea Concentrates"],
  airport: ["Beverage Premixes", "Tea Concentrates"],
  railway: ["Beverage Premixes", "Tea Concentrates"],
  dhaba: ["Beverage Premixes", "Tea Concentrates"],

  // Educational
  college: ["Beverage Premixes", "Milkshake & Lassi Mixes", "Mocktail & Lemonade Mixes"],
  school: ["Beverage Premixes", "Milkshake & Lassi Mixes"],
  university: ["Beverage Premixes", "Milkshake & Lassi Mixes", "Mocktail & Lemonade Mixes"],

  // Entertainment
  multiplex: ["Beverage Premixes", "Milkshake & Lassi Mixes", "Popping Boba"],
  cinema: ["Beverage Premixes", "Milkshake & Lassi Mixes"],

  // Events / catering
  event: ["Mocktail & Lemonade Mixes", "Beverage Premixes", "Popping Boba"],
  catering: ["Mocktail & Lemonade Mixes", "Beverage Premixes", "Industrial Ingredients"],
  wedding: ["Mocktail & Lemonade Mixes", "Milkshake & Lassi Mixes", "Boba Desserts"],
  party: ["Mocktail & Lemonade Mixes", "Popping Boba", "Boba Desserts"],
  festival: ["Mocktail & Lemonade Mixes", "Beverage Premixes", "Popping Boba"],

  // Startups / new businesses
  startup: ["Beverage Premixes", "Popping Boba", "Tapioca Pearls", "Syrups & Bases"],
  "cloud kitchen": ["Beverage Premixes", "Milkshake & Lassi Mixes", "Mocktail & Lemonade Mixes"],
  cloud: ["Beverage Premixes", "Milkshake & Lassi Mixes", "Mocktail & Lemonade Mixes"],
  kitchen: ["Beverage Premixes", "Milkshake & Lassi Mixes"],
  delivery: ["Beverage Premixes", "Milkshake & Lassi Mixes", "Mocktail & Lemonade Mixes"],
  zomato: ["Beverage Premixes", "Milkshake & Lassi Mixes"],
  swiggy: ["Beverage Premixes", "Milkshake & Lassi Mixes"],

  // Distribution
  distributor: ["Industrial Ingredients", "Beverage Premixes", "Popping Boba"],
  wholesale: ["Industrial Ingredients", "Tapioca Pearls", "Popping Boba"],
  supplier: ["Industrial Ingredients", "Beverage Premixes"],
  trader: ["Industrial Ingredients", "Beverage Premixes"],

  // Wellness / health
  wellness: ["Beverage Premixes", "Tea Concentrates"],
  yoga: ["Beverage Premixes", "Tea Concentrates"],
  gym: ["Milkshake & Lassi Mixes", "Beverage Premixes"],
  ayurvedic: ["Beverage Premixes", "Tea Concentrates"],
  pharmacy: ["Beverage Premixes", "Tea Concentrates"],

  // Indian food
  biryani: ["Beverage Premixes", "Mocktail & Lemonade Mixes"],
  punjabi: ["Milkshake & Lassi Mixes", "Beverage Premixes"],
  lassi: ["Milkshake & Lassi Mixes"],
  milkshake: ["Milkshake & Lassi Mixes", "Beverage Premixes"],
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
  const searchText = [lead.businessName, lead.ownerName, lead.notes].filter(Boolean).join(" ");
  const targetCategories = detectCategories(searchText);

  const products = await db.product.findMany({
    where: { isActive: true, category: { name: { in: targetCategories } } },
    include: { category: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
  });

  // If no match, fall back to bestsellers
  const finalProducts = products.length > 0
    ? products
    : await db.product.findMany({ where: { isActive: true }, include: { category: true }, take: 4, orderBy: { sortOrder: "asc" } });

  const ownerName = lead.ownerName ?? "Sir/Ma'am";
  const firstName = ownerName.split(" ")[0];
  const location = [lead.city, lead.state].filter(Boolean).join(", ");

  const recommended: RecommendedProduct[] = finalProducts.slice(0, 4).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category.name,
    reason: deriveReason(p.keyBenefits ?? "", lead.businessName),
    mrp: p.mrp,
    dealerPrice: p.dealerPrice,
    moq: p.moq,
  }));

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
- 8 dedicated production lines in Hyderabad with direct tea sourcing from Assam, West Bengal, Tamil Nadu & Sri Lanka
- Trusted by **500+ partners** across cafes, hotels, QSRs and cloud kitchens

**Products we recommend for ${lead.businessName}:**

${productLines}

💡 **Stop comparing price per kg. Start comparing cost per cup.**
Our premixes deliver a cost per cup of ₹8–15, while you sell at ₹80–150. That's the math of premium margins.

We would love to arrange a **free sample kit** and a short product demo for your team. No commitment needed — just taste the difference!

**Next Steps:**
- Reply to arrange your free sample kit (delivered to your door)
- Ask for our complete product catalog with full pricing
- Or call us directly to discuss a custom menu for ${lead.businessName}

Looking forward to growing together!

Warm regards,
The Tea Planet Sales Team
📞 +91-8886277713 | 🌐 www.theteaplanet.com
_India's #1 Beverage Premix Partner_`;

  const subject = `Free Sample Kit for ${lead.businessName} — 200%+ Margin Beverages | The Tea Planet`;

  const waMessage = buildWhatsAppMessage(firstName, lead.businessName, location, recommended.slice(0, 3));

  return { subject, pitch, recommendedProducts: recommended, whatsappMessage: waMessage };
}

function deriveReason(keyBenefits: string, businessName: string): string {
  if (!keyBenefits) return `Perfect fit for ${businessName}`;
  const parts = keyBenefits.split(",").map((s) => s.trim());
  return parts.slice(0, 2).join(" · ") || keyBenefits.slice(0, 100);
}

function buildWhatsAppMessage(firstName: string, businessName: string, location: string, products: RecommendedProduct[]): string {
  const prodList = products.map((p) => `• ${p.name}`).join("\n");
  return `Hi ${firstName}! 👋

I'm reaching out from *The Tea Planet* — India's First Bubble Tea Manufacturer (Est. 2011) 🏆

We help businesses like *${businessName}*${location ? ` in ${location}` : ""} launch high-margin beverage menus in just *7 days*!

Some products that would work great for you:
${prodList}

💰 *200%+ gross margin* on every cup you serve
⚡ No special equipment needed
✅ FSSC 22000 · FSSAI · HALAL certified

Interested in a *FREE sample kit*? No commitment — just taste the quality! 🍵

Reply *YES* and I'll arrange delivery to your door! 🚀

_The Tea Planet | +91-8886277713 | www.theteaplanet.com_`;
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

  // Fit score — how well does the business type match our products
  const searchText = [lead.businessName, lead.notes].filter(Boolean).join(" ").toLowerCase();
  const signalMatches = Object.keys(CUSTOMER_SIGNALS).filter((k) => searchText.includes(k)).length;
  const fitScore = Math.min(100, signalMatches * 12 + (lead.phone ? 10 : 0) + (lead.email ? 10 : 0));

  // Engagement score — based on activity count
  const activityCount = lead.activities.length;
  const engageScore = Math.min(100, activityCount * 12);

  // Intent score — based on pipeline status
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
