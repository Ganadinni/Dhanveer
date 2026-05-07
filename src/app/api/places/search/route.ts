import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Google Places API key not configured" }, { status: 503 });

  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return NextResponse.json({ error: data.error_message ?? data.status }, { status: 502 });
  }

  const places = (data.results ?? []).map((p: GooglePlace) => ({
    placeId: p.place_id,
    name: p.name,
    address: p.formatted_address,
    rating: p.rating,
    totalRatings: p.user_ratings_total,
    businessStatus: p.business_status,
    types: p.types,
  }));

  return NextResponse.json({ places });
}

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
}
