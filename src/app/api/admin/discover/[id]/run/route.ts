import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { searchGooglePlaces } from "@/lib/googlePlaces";
import { runLeadResearch } from "@/lib/researchEngine";
import { scoreLead } from "@/lib/pitchEngine";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const config = await db.discoverySearch.findUnique({ where: { id } });
  if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results = await runDiscovery(config.query, config.cities, config.tagsToApply);

  await db.discoverySearch.update({
    where: { id },
    data: {
      lastRunAt: new Date(),
      lastFoundCount: results.added,
      totalAdded: { increment: results.added },
    },
  });

  return NextResponse.json(results);
}

export async function runDiscovery(
  query: string,
  cities: string[],
  tagsToApply: string[]
): Promise<{ added: number; skipped: number; errors: string[] }> {
  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const city of cities) {
    try {
      const places = await searchGooglePlaces(query, city);

      for (const place of places) {
        // Skip if already in DB by Google Place ID
        const existing = await db.lead.findUnique({
          where: { googlePlaceId: place.googlePlaceId },
          select: { id: true },
        });
        if (existing) { skipped++; continue; }

        // Also skip near-duplicate by name + city
        const nameDupe = await db.lead.findFirst({
          where: {
            businessName: { equals: place.businessName, mode: "insensitive" },
            city: { equals: city, mode: "insensitive" },
          },
          select: { id: true },
        });
        if (nameDupe) {
          // Update with Google Place ID if missing
          await db.lead.update({
            where: { id: nameDupe.id },
            data: { googlePlaceId: place.googlePlaceId },
          });
          skipped++;
          continue;
        }

        const newLead = await db.lead.create({
          data: {
            businessName: place.businessName,
            phone: place.phone,
            address: place.address,
            city: place.city,
            state: place.state,
            source: "GOOGLE_PLACES",
            status: "NEW",
            tags: tagsToApply,
            googlePlaceId: place.googlePlaceId,
            notes: [
              place.rating ? `Google Rating: ${place.rating}/5 (${place.reviewCount ?? 0} reviews)` : null,
              place.website ? `Website: ${place.website}` : null,
            ].filter(Boolean).join("\n") || null,
          },
        });
        added++;

        // Auto-research + score each new lead (fire sequentially — silently skips if no AI key)
        try {
          await runLeadResearch(newLead.id, "Discovery");
        } catch {
          // Research failure must not stop the import
          await scoreLead(newLead.id).catch(() => null);
        }
      }
    } catch (err) {
      errors.push(`${city}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { added, skipped, errors };
}
