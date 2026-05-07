import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface PlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  formatted_address?: string;
  website?: string;
  url?: string;
  address_components?: AddressComponent[];
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetailsResult | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "place_id,name,formatted_phone_number,international_phone_number,formatted_address,website,address_components");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.status !== "OK") return null;
  return data.result;
}

function extractCity(components: AddressComponent[] = []): string | null {
  const cityTypes = ["locality", "sublocality_level_1", "administrative_area_level_2"];
  for (const type of cityTypes) {
    const match = components.find((c) => c.types.includes(type));
    if (match) return match.long_name;
  }
  return null;
}

function extractState(components: AddressComponent[] = []): string | null {
  const match = components.find((c) => c.types.includes("administrative_area_level_1"));
  return match?.long_name ?? null;
}

function extractPincode(components: AddressComponent[] = []): string | null {
  const match = components.find((c) => c.types.includes("postal_code"));
  return match?.long_name ?? null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Google Places API key not configured" }, { status: 503 });

  const { placeIds } = await req.json() as { placeIds: string[] };
  if (!Array.isArray(placeIds) || placeIds.length === 0) {
    return NextResponse.json({ error: "placeIds array required" }, { status: 400 });
  }

  const results = { imported: 0, skipped: 0, errors: 0 };

  for (const placeId of placeIds) {
    try {
      const existing = await db.lead.findUnique({ where: { googlePlaceId: placeId } });
      if (existing) { results.skipped++; continue; }

      const details = await fetchPlaceDetails(placeId, apiKey);
      if (!details) { results.errors++; continue; }

      await db.lead.create({
        data: {
          businessName: details.name,
          phone: details.formatted_phone_number ?? details.international_phone_number ?? null,
          address: details.formatted_address ?? null,
          city: extractCity(details.address_components),
          state: extractState(details.address_components),
          pincode: extractPincode(details.address_components),
          source: "GOOGLE_PLACES",
          googlePlaceId: placeId,
          assignedToId: session.user.id,
        },
      });

      results.imported++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json(results);
}
