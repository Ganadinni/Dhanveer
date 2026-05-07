import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

export type Platform = "instagram" | "linkedin" | "youtube" | "facebook";

const PLATFORM_SITE: Record<Platform, string> = {
  instagram: "site:instagram.com",
  linkedin:  "site:linkedin.com/company OR site:linkedin.com/in",
  youtube:   "site:youtube.com",
  facebook:  "site:facebook.com",
};

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  linkedin:  "LinkedIn",
  youtube:   "YouTube",
  facebook:  "Facebook",
};

interface SerperResult {
  title: string;
  snippet: string;
  link: string;
}

async function serperSearch(query: string): Promise<SerperResult[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, gl: "in", hl: "en", num: 10 }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.organic ?? [];
  } catch {
    return [];
  }
}

interface ExtractedBusiness {
  businessName: string;
  city: string;
  platform: string;
  handle: string;
  profileUrl: string;
  notes: string;
}

async function extractBusinesses(
  results: SerperResult[],
  platform: Platform,
  city: string,
  keywords: string[]
): Promise<ExtractedBusiness[]> {
  if (!process.env.ANTHROPIC_API_KEY || results.length === 0) return [];

  const client = new Anthropic();
  const snippet = results
    .map((r, i) => `${i + 1}. Title: ${r.title}\n   URL: ${r.link}\n   Snippet: ${r.snippet}`)
    .join("\n\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `You are extracting F&B business leads from ${PLATFORM_LABEL[platform]} search results for the city of ${city}.

Keywords searched: ${keywords.join(", ")}

Search results:
${snippet}

Extract only genuine F&B businesses (cafes, restaurants, bakeries, bubble tea shops, hotels, food brands, etc.).
Skip personal accounts, media pages, directories, and non-business profiles.

For each business found, return a JSON array:
[
  {
    "businessName": "exact business name",
    "city": "${city}",
    "platform": "${platform}",
    "handle": "username or handle without @",
    "profileUrl": "full URL from search result",
    "notes": "one sentence about what they do based on the snippet"
  }
]

If no genuine F&B businesses are found, return an empty array [].
Respond ONLY with the JSON array, no other text.`,
    }],
  });

  try {
    const text = (message.content[0] as { type: string; text: string }).text.trim();
    const json = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export async function runSocialMonitor(monitorId: string): Promise<{ added: number; skipped: number; errors: string[] }> {
  const monitor = await db.socialMonitor.findUnique({ where: { id: monitorId } });
  if (!monitor) return { added: 0, skipped: 0, errors: ["Monitor not found"] };

  if (!process.env.SERPER_API_KEY) return { added: 0, skipped: 0, errors: ["SERPER_API_KEY not configured"] };
  if (!process.env.ANTHROPIC_API_KEY) return { added: 0, skipped: 0, errors: ["ANTHROPIC_API_KEY not configured"] };

  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  const platforms = monitor.platforms as Platform[];
  const keywordStr = monitor.keywords.join(" OR ");

  for (const city of monitor.cities) {
    for (const platform of platforms) {
      try {
        const siteOp = PLATFORM_SITE[platform];
        const query = `(${siteOp}) (${keywordStr}) "${city}" cafe OR restaurant OR food OR bakery OR hotel`;

        const results = await serperSearch(query);
        if (results.length === 0) continue;

        const businesses = await extractBusinesses(results, platform, city, monitor.keywords);

        for (const biz of businesses) {
          if (!biz.businessName?.trim()) continue;

          // Deduplicate: check name + city
          const existing = await db.lead.findFirst({
            where: {
              businessName: { equals: biz.businessName.trim(), mode: "insensitive" },
              city: { equals: biz.city?.trim() || city, mode: "insensitive" },
            },
            select: { id: true },
          });

          if (existing) { skipped++; continue; }

          const notes = [
            biz.notes,
            biz.handle ? `${PLATFORM_LABEL[platform]}: @${biz.handle}` : null,
            biz.profileUrl ? biz.profileUrl : null,
          ].filter(Boolean).join(" | ");

          await db.lead.create({
            data: {
              businessName: biz.businessName.trim(),
              city: biz.city?.trim() || city,
              notes,
              tags: monitor.tagsToApply,
              source: "SOCIAL_MEDIA",
              status: "NEW",
            },
          });
          added++;
        }
      } catch (err) {
        errors.push(`${platform}/${city}: ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }
  }

  await db.socialMonitor.update({
    where: { id: monitorId },
    data: {
      lastRunAt: new Date(),
      lastFoundCount: added,
      totalAdded: { increment: added },
    },
  });

  return { added, skipped, errors };
}
