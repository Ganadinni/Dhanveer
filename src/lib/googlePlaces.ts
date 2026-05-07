// Google Places API (New) — text search for F&B lead discovery

export interface PlaceResult {
  googlePlaceId: string;
  businessName: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string;
  state: string | null;
  rating: number | null;
  reviewCount: number | null;
}

interface RawPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
}

// Indian state detection from address string
const STATE_PATTERNS: [RegExp, string][] = [
  [/karnataka/i, "Karnataka"],
  [/telangana/i, "Telangana"],
  [/andhra/i, "Andhra Pradesh"],
  [/tamil\s*nadu/i, "Tamil Nadu"],
  [/maharashtra/i, "Maharashtra"],
  [/delhi/i, "Delhi"],
  [/gujarat/i, "Gujarat"],
  [/rajasthan/i, "Rajasthan"],
  [/kerala/i, "Kerala"],
  [/west\s*bengal/i, "West Bengal"],
  [/punjab/i, "Punjab"],
  [/haryana/i, "Haryana"],
  [/uttar\s*pradesh/i, "Uttar Pradesh"],
  [/madhya\s*pradesh/i, "Madhya Pradesh"],
  [/goa/i, "Goa"],
];

function detectState(address: string): string | null {
  for (const [pattern, name] of STATE_PATTERNS) {
    if (pattern.test(address)) return name;
  }
  return null;
}

export async function searchGooglePlaces(
  query: string,
  city: string
): Promise<PlaceResult[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY not configured");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.businessStatus",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: `${query} in ${city}`,
      maxResultCount: 20,
      languageCode: "en",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const places: RawPlace[] = data.places ?? [];

  return places
    .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY" && p.displayName?.text)
    .map((p) => ({
      googlePlaceId: p.id,
      businessName: p.displayName!.text,
      phone: p.nationalPhoneNumber ?? null,
      website: p.websiteUri ?? null,
      address: p.formattedAddress ?? null,
      city,
      state: p.formattedAddress ? detectState(p.formattedAddress) : null,
      rating: p.rating ?? null,
      reviewCount: p.userRatingCount ?? null,
    }));
}
