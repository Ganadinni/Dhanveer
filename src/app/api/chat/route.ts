import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ToolInput = Record<string, unknown>;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatAction {
  type: "lead_created" | "leads_found";
  leadId?: string;
  leadName?: string;
  leads?: Array<{ id: string; name: string; city: string | null; status: string }>;
}

// ── Tool definitions ─────────────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: "create_lead",
    description: "Create a new lead in the CRM. Use when the user mentions a business with a phone number or enough detail to warrant tracking. Always check for duplicates first using search_leads.",
    input_schema: {
      type: "object" as const,
      properties: {
        businessName: { type: "string", description: "Name of the business" },
        phone: { type: "string", description: "Phone number if mentioned" },
        city: { type: "string", description: "City if mentioned" },
        ownerName: { type: "string", description: "Owner name if mentioned" },
        notes: { type: "string", description: "Any context or notes from the conversation" },
        tags: { type: "array", items: { type: "string" }, description: "Relevant tags: Cafe, QSR Chain, Key Account, Hotels/Bakery/Restaurant, PAN Asian, Dessert Stores, Industrial, Chef/Consultant, Distributors, Export" },
      },
      required: ["businessName"],
    },
  },
  {
    name: "search_leads",
    description: "Search existing leads in the CRM by name, city, tag, or status. Use to check duplicates, find chain locations, or answer questions about the pipeline.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Business name or keyword to search" },
        city: { type: "string", description: "Filter by city" },
        tag: { type: "string", description: "Filter by tag" },
        status: { type: "string", description: "Filter by status: NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST" },
      },
    },
  },
  {
    name: "get_lead_research",
    description: "Get the saved research data for a specific lead. Use to answer questions about a business, cross-reference with others, or surface intelligence.",
    input_schema: {
      type: "object" as const,
      properties: {
        leadId: { type: "string", description: "The lead ID" },
      },
      required: ["leadId"],
    },
  },
  {
    name: "find_chain_connections",
    description: "Find potential chain store connections — leads with similar business names across different cities. Useful for identifying national/regional chains.",
    input_schema: {
      type: "object" as const,
      properties: {
        businessName: { type: "string", description: "Business name or brand to search for across cities" },
      },
      required: ["businessName"],
    },
  },
];

// ── Tool executors ────────────────────────────────────────────────────────────

async function executeTool(name: string, input: ToolInput, userId: string): Promise<{ result: unknown; action?: ChatAction }> {
  if (name === "create_lead") {
    const { businessName, phone, city, ownerName, notes, tags } = input as {
      businessName: string; phone?: string; city?: string; ownerName?: string; notes?: string; tags?: string[];
    };

    // Duplicate check
    const existing = await db.lead.findFirst({
      where: {
        businessName: { equals: businessName, mode: "insensitive" },
        ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      },
      select: { id: true, businessName: true, city: true },
    });
    if (existing) {
      return {
        result: { alreadyExists: true, leadId: existing.id, businessName: existing.businessName, city: existing.city },
        action: { type: "leads_found", leads: [{ id: existing.id, name: existing.businessName, city: existing.city, status: "existing" }] },
      };
    }

    const lead = await db.lead.create({
      data: {
        businessName,
        phone: phone ?? null,
        city: city ?? null,
        ownerName: ownerName ?? null,
        notes: notes ?? null,
        tags: tags ?? [],
        source: "MANUAL",
        status: "NEW",
        assignedToId: userId,
      },
    });

    // Trigger background research + scoring if AI is configured
    if (process.env.ANTHROPIC_API_KEY) {
      const { runLeadResearch } = await import("@/lib/researchEngine");
      runLeadResearch(lead.id, "Sales Chat").catch(() => null);
    } else {
      const { scoreLead } = await import("@/lib/pitchEngine");
      scoreLead(lead.id).catch(() => null);
    }

    return {
      result: { created: true, leadId: lead.id, businessName: lead.businessName, city: lead.city },
      action: { type: "lead_created", leadId: lead.id, leadName: lead.businessName },
    };
  }

  if (name === "search_leads") {
    const { query, city, tag, status } = input as { query?: string; city?: string; tag?: string; status?: string };
    const leads = await db.lead.findMany({
      where: {
        ...(query ? { businessName: { contains: query, mode: "insensitive" } } : {}),
        ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
        ...(status ? { status: status as never } : {}),
      },
      select: {
        id: true, businessName: true, city: true, status: true, tags: true,
        score: { select: { score: true, tier: true } },
        researchedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return {
      result: leads,
      action: leads.length > 0 ? {
        type: "leads_found",
        leads: leads.map(l => ({ id: l.id, name: l.businessName, city: l.city, status: l.status })),
      } : undefined,
    };
  }

  if (name === "get_lead_research") {
    const { leadId } = input as { leadId: string };
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      select: {
        businessName: true, city: true, tags: true, notes: true,
        researchData: true, researchedAt: true,
        score: { select: { score: true, tier: true, reasoning: true } },
      },
    });
    if (!lead) return { result: { error: "Lead not found" } };
    return { result: lead };
  }

  if (name === "find_chain_connections") {
    const { businessName } = input as { businessName: string };
    // Search for leads with similar names (first significant word)
    const keyword = businessName.split(/\s+/).find(w => w.length > 3) ?? businessName;
    const matches = await db.lead.findMany({
      where: { businessName: { contains: keyword, mode: "insensitive" } },
      select: { id: true, businessName: true, city: true, status: true, tags: true },
      orderBy: { city: "asc" },
      take: 20,
    });
    return {
      result: { keyword, matches, totalFound: matches.length },
      action: matches.length > 1 ? {
        type: "leads_found",
        leads: matches.map(l => ({ id: l.id, name: l.businessName, city: l.city, status: l.status })),
      } : undefined,
    };
  }

  return { result: { error: `Unknown tool: ${name}` } };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const { message, history = [] } = await req.json() as { message: string; history: ChatMessage[] };
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const [totalLeads, hotLeads, recentLeads] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { score: { tier: "HOT" } } }),
    db.lead.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: { id: true, businessName: true, city: true, status: true },
    }),
  ]);

  const crmContext = `CRM snapshot: ${totalLeads} total leads, ${hotLeads} HOT. Recent: ${recentLeads.map(l => `${l.businessName} (${l.city ?? "?"})`).join(", ")}.`;

  const systemPrompt = `You are the sales intelligence assistant for The Tea Planet — India's first bubble tea manufacturer. You help the sales team manage leads, surface insights, and spot opportunities.

${crmContext}

Your capabilities:
- Create leads when someone mentions a business + phone number or enough context
- Search and surface patterns across leads
- Pull research data on any lead and correlate it with others
- Identify chain stores (same brand in multiple cities)
- Answer questions about the pipeline

How to behave:
- Be direct and brief. One insight is better than five bullet points.
- When you create a lead, say so clearly and offer to research it.
- When you spot a chain (multiple cities, same name), call it out — it's a key account opportunity.
- If someone pastes raw text with a phone number in it, extract the business details and create the lead.
- You speak to salespeople who are busy — be useful, not verbose.
- Never say "Great question!" or similar filler.`;

  const client = new Anthropic();
  const allActions: ChatAction[] = [];

  // Build message history for Claude
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m): Anthropic.MessageParam => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  // Agentic loop — keep running until Claude stops asking for tools
  let response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUses = response.content.filter((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUses) {
      const { result, action } = await executeTool(toolUse.name, toolUse.input as ToolInput, session.id);
      if (action) allActions.push(action);
      toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(result) });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    });
  }

  const replyText = response.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  return NextResponse.json({ reply: replyText, actions: allActions });
}
