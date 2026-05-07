import { db } from "@/lib/db";
import { searchGooglePlaces } from "@/lib/googlePlaces";
import { runLeadResearch } from "@/lib/researchEngine";
import { scoreLead } from "@/lib/pitchEngine";

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
        const existing = await db.lead.findUnique({
          where: { googlePlaceId: place.googlePlaceId },
          select: { id: true },
        });
        if (existing) { skipped++; continue; }

        const nameDupe = await db.lead.findFirst({
          where: {
            businessName: { equals: place.businessName, mode: "insensitive" },
            city: { equals: city, mode: "insensitive" },
          },
          select: { id: true },
        });
        if (nameDupe) {
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

        try {
          await runLeadResearch(newLead.id, "Discovery");
        } catch {
          await scoreLead(newLead.id).catch(() => null);
        }
      }
    } catch (err) {
      errors.push(`${city}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { added, skipped, errors };
}
