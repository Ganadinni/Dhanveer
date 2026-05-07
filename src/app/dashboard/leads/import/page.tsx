"use client";

import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { useState } from "react";

interface Place {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  totalRatings?: number;
  businessStatus?: string;
}

export default function ImportLeadsPage() {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    setImportResult(null);
    setSelected(new Set());

    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setPlaces(data.places);
      if (data.places.length === 0) setSearchError("No businesses found. Try a different search.");
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
      setPlaces([]);
    } finally {
      setSearching(false);
    }
  }

  function toggleSelect(placeId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === places.length) setSelected(new Set());
    else setSelected(new Set(places.map((p) => p.placeId)));
  }

  async function handleImport() {
    if (selected.size === 0) return;
    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch("/api/places/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setImportResult(data);
      setSelected(new Set());
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Import from Google Maps" subtitle="Search and import business leads">
        <Link href="/dashboard/leads" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Leads
        </Link>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "tea shops in Mumbai" or "cafes in Bangalore"'
              className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </form>
        </div>

        {/* Import result banner */}
        {importResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            ✅ Import complete — <strong>{importResult.imported} imported</strong>
            {importResult.skipped > 0 && `, ${importResult.skipped} already existed`}
            {importResult.errors > 0 && `, ${importResult.errors} failed`}.{" "}
            <Link href="/dashboard/leads" className="underline font-medium">View leads →</Link>
          </div>
        )}

        {/* Error */}
        {searchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {searchError}
          </div>
        )}

        {/* Results */}
        {places.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.size === places.length}
                  onChange={toggleAll}
                  className="rounded"
                />
                <span className="text-sm text-slate-600">
                  {places.length} results · {selected.size} selected
                </span>
              </div>
              {selected.size > 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                >
                  {importing ? "Importing…" : `Import ${selected.size} lead${selected.size > 1 ? "s" : ""}`}
                </button>
              )}
            </div>

            <ul className="divide-y divide-slate-100">
              {places.map((place) => (
                <li
                  key={place.placeId}
                  onClick={() => toggleSelect(place.placeId)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    selected.has(place.placeId) ? "bg-green-50" : "hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(place.placeId)}
                    onChange={() => toggleSelect(place.placeId)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{place.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{place.address}</p>
                    {place.rating && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        ★ {place.rating} ({place.totalRatings?.toLocaleString()} reviews)
                      </p>
                    )}
                  </div>
                  {place.businessStatus === "CLOSED_PERMANENTLY" && (
                    <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full shrink-0">Closed</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
