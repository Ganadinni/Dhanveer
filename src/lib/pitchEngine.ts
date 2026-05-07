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

// Keyword → product affinity map (customer type signals)
const CUSTOMER_SIGNALS: Record<string, string[]> = {
  cafe: ["Boba Bubble Tea Premixes", "Coffee Premixes", "Fruit-Based Beverages"],
  coffee: ["Coffee Premixes", "Boba Bubble Tea Premixes"],
  restaurant: ["Instant Tea Premixes", "Coffee Premixes", "Fruit-Based Beverages"],
  hotel: ["Instant Tea Premixes", "Coffee Premixes", "Dairy & Milk Beverages", "Health & Wellness"],
  hospital: ["Instant Tea Premixes", "Health & Wellness"],
  office: ["Instant Tea Premixes", "Coffee Premixes"],
  canteen: ["Instant Tea Premixes", "Coffee Premixes"],
  sweet: ["Dairy & Milk Beverages", "Boba Bubble Tea Premixes"],
  bakery: ["Boba Bubble Tea Premixes", "Coffee Premixes"],
  juice: ["Fruit-Based Beverages", "Boba Bubble Tea Premixes"],
  bar: ["Fruit-Based Beverages"],
  wellness: ["Health & Wellness", "Instant Tea Premixes"],
  yoga: ["Health & Wellness"],
  gym: ["Health & Wellness", "Dairy & Milk Beverages"],
  resort: ["Boba Bubble Tea Premixes", "Fruit-Based Beverages", "Coffee Premixes"],
  college: ["Boba Bubble Tea Premixes", "Coffee Premixes"],
  school: ["Boba Bubble Tea Premixes", "Instant Tea Premixes"],
  multiplex: ["Boba Bubble Tea Premixes", "Coffee Premixes"],
  qsr: ["Boba Bubble Tea Premixes", "Instant Tea Premixes", "Coffee Premixes"],
  chain: ["Boba Bubble Tea Premixes", "Instant Tea Premixes", "Coffee Premixes"],
  pharmacy: ["Health & Wellness"],
  ayurvedic: ["Health & Wellness", "Instant Tea Premixes"],
  mithai: ["Dairy & Milk Beverages"],
  dhaba: ["Instant Tea Premixes"],
  airport: ["Instant Tea Premixes", "Coffee Premixes"],
};

function detectCategories(text: string): string[] {
  const lower = text.toLowerCase();
  const matched = new Set<string>();
  for (const [keyword, cats] of Object.entries(CUSTOMER_SIGNALS)) {
    if (lower.includes(keyword)) cats.forEach((c) => matched.add(c));
  }
  return matched.size > 0 ? Array.from(matched) : ["Boba Bubble Tea Premixes", "Instant Tea Premixes"];
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

  // Build recommended product list with reasons
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

Greetings from **The Tea Planet** — India's leading beverage premix company!

We noticed that **${lead.businessName}**${location ? ` in ${location}` : ""} is in the F&B/hospitality space, and we believe our products can add significant value to your menu and margins.

**Why The Tea Planet?**
- Premium quality premixes trusted by 500+ cafes, hotels and QSRs across India
- Easy preparation — no special equipment needed
- Consistent taste every single time
- High-margin beverages that customers love

**Products we recommend for ${lead.businessName}:**

${productLines}

We would love to arrange a free sample kit and a short product demo for your team. No commitment needed — just taste the difference!

**Next Steps:**
- Reply to this message or call us to arrange your free sample kit
- We can also share our complete product catalog with pricing

Looking forward to partnering with you!

Warm regards,
The Tea Planet Sales Team
📞 +91-8886277713 | 🌐 www.theteaplanet.com`;

  const subject = `Free Sample Kit for ${lead.businessName} — Premium Beverage Premixes`;

  const waMessage = buildWhatsAppMessage(firstName, lead.businessName, recommended.slice(0, 3));

  return { subject, pitch, recommendedProducts: recommended, whatsappMessage: waMessage };
}

function deriveReason(keyBenefits: string, businessName: string): string {
  if (!keyBenefits) return `Perfect fit for ${businessName}`;
  const parts = keyBenefits.split(",").map((s) => s.trim());
  return parts.slice(0, 2).join(" · ") || keyBenefits.slice(0, 100);
}

function buildWhatsAppMessage(firstName: string, businessName: string, products: RecommendedProduct[]): string {
  const prodList = products.map((p) => `• ${p.name}`).join("\n");
  return `Hi ${firstName}! 👋

I'm reaching out from *The Tea Planet* — India's premium beverage premix company.

We'd love to help *${businessName}* add high-margin drinks to your menu! 🍵

Some products we think would work great for you:
${prodList}

Interested in a FREE sample kit? No commitment, just taste the quality! ✅

Reply *YES* and I'll arrange delivery right away! 🚀`;
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
  const fitScore = Math.min(100, signalMatches * 15 + (lead.phone ? 10 : 0) + (lead.email ? 10 : 0));

  // Engagement score — based on activity count
  const activityCount = lead.activities.length;
  const engageScore = Math.min(100, activityCount * 12);

  // Intent score — based on status
  const STATUS_INTENT: Record<string, number> = {
    NEW: 10, CONTACTED: 30, QUALIFIED: 55, PROPOSAL_SENT: 70, NEGOTIATION: 85, WON: 100, LOST: 0,
  };
  const intentScore = STATUS_INTENT[lead.status] ?? 10;

  const score = Math.round((fitScore * 0.35) + (engageScore * 0.3) + (intentScore * 0.35));
  const tier = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD";

  const reasoning = [
    fitScore >= 30 ? "Strong business type match" : "Generic business type",
    engageScore >= 30 ? `Active engagement (${activityCount} activities)` : "Limited engagement",
    intentScore >= 55 ? "High buying intent (pipeline stage)" : intentScore >= 30 ? "Mid-funnel" : "Early stage",
  ].join(" · ");

  await db.leadScore.upsert({
    where: { leadId },
    update: { score, tier, fitScore, engageScore, intentScore, reasoning, lastScoredAt: new Date() },
    create: { leadId, score, tier, fitScore, engageScore, intentScore, reasoning },
  });
}
