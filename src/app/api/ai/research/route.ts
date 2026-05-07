import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { userHasPermission } from "@/lib/permissions";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

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

// Optional: Serper.dev for real web results (set SERPER_API_KEY env var)
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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await userHasPermission(session.id, session.role, "deep_research"))) {
    return NextResponse.json({ error: "You don't have access to Deep Research. Ask your admin to enable it." }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured — add ANTHROPIC_API_KEY to environment variables" }, { status: 503 });
  }

  const client = new Anthropic();
  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const [lead, productCatalog] = await Promise.all([
    db.lead.findUnique({
      where: { id: leadId },
      include: { activities: { orderBy: { createdAt: "desc" }, take: 10 }, score: true },
    }),
    buildProductCatalog(),
  ]);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const location = [lead.city, lead.state].filter(Boolean).join(", ");
  const businessName = lead.businessName;
  const activitySummary = lead.activities
    .map((a) => `${a.type}: ${a.note?.slice(0, 100)}`)
    .join("\n");

  // Run web searches if Serper API key is available
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
  "menuInsights": "What menu items they likely have. What beverage gaps exist. What's missing that we can fill",
  "seasonalOpportunities": "Given the current month (${today}), what seasonal drinks/trends should we push? Summer? Festive season? Wedding season?",
  "recommendedProducts": "Specific The Tea Planet products (use real category names and product names) that fit this business. Be specific — not generic",
  "recipeIdeas": "2-3 concrete recipe ideas using TTP products tailored to their menu. E.g. 'Brown Sugar Boba Taro Shake using our Taro Premix + Brown Sugar Syrup'",
  "areaInsights": "F&B landscape in ${location || "their city"}. Competition level. What's trending locally. Avg consumer spend",
  "pitchAngles": "Top 3 specific sales angles to use with this business. Be tactical",
  "quickLinks": ["Google: https://www.google.com/search?q=${encodeURIComponent(businessName + " " + location)}", "Instagram: https://www.instagram.com/${businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}", "Zomato: https://www.zomato.com/${(location || "india").toLowerCase().split(",")[0].trim().replace(/\s+/g, "-")}"],
  "summary": "2-sentence exec summary for the sales rep: what's the opportunity and what's the best opening line"
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  const research = JSON.parse(jsonText);

  // Optionally log research as a lead activity (note)
  await db.leadActivity.create({
    data: {
      leadId,
      type: "NOTE",
      note: `🔍 Deep Research run by ${session.name}. Summary: ${research.summary ?? ""}`,
    },
  });

  return NextResponse.json(research);
}
