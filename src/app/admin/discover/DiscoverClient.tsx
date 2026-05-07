"use client";

import { useEffect, useState } from "react";

const LEAD_TAGS = ["Cafe", "QSR Chain", "Key Account", "Hotels/Bakery/Restaurant", "PAN Asian", "Dessert Stores", "Industrial", "Chef/Consultant", "Distributors", "Export"];

interface DiscoverySearch {
  id: string;
  label: string;
  cities: string[];
  query: string;
  tagsToApply: string[];
  isActive: boolean;
  lastRunAt: string | null;
  lastFoundCount: number;
  totalAdded: number;
  createdAt: string;
}

interface RunResult {
  added: number;
  skipped: number;
  errors: string[];
}

const PRESET_QUERIES: { label: string; query: string }[] = [
  { label: "Cafes & Bubble Tea", query: "cafe bubble tea boba" },
  { label: "Restaurants", query: "restaurant dining" },
  { label: "Bakeries & Desserts", query: "bakery dessert patisserie" },
  { label: "Hotels & Resorts", query: "hotel resort" },
  { label: "QSR & Fast Food", query: "fast food qsr food court" },
  { label: "Bars & Lounges", query: "bar lounge pub" },
];

export function DiscoverClient({ isConfigured }: { isConfigured: boolean }) {
  const [searches, setSearches] = useState<DiscoverySearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [runResults, setRunResults] = useState<Record<string, RunResult>>({});

  // Form state
  const [label, setLabel] = useState("");
  const [citiesInput, setCitiesInput] = useState("");
  const [query, setQuery] = useState("");
  const [tagsToApply, setTagsToApply] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch("/api/admin/discover")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSearches(d); })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const cities = citiesInput.split(/[,\n]+/).map((c) => c.trim()).filter(Boolean);
    if (!label.trim() || cities.length === 0 || !query.trim()) {
      setFormError("Label, at least one city, and a search query are required.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), cities, query: query.trim(), tagsToApply }),
    });
    setSaving(false);
    if (res.ok) {
      const created = await res.json();
      setSearches((prev) => [created, ...prev]);
      setShowForm(false);
      setLabel(""); setCitiesInput(""); setQuery(""); setTagsToApply([]);
    } else {
      const err = await res.json();
      setFormError(err.error ?? "Failed to save");
    }
  }

  async function toggleActive(search: DiscoverySearch) {
    const res = await fetch(`/api/admin/discover/${search.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !search.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSearches((prev) => prev.map((s) => (s.id === search.id ? updated : s)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this discovery search?")) return;
    await fetch(`/api/admin/discover/${id}`, { method: "DELETE" });
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleRun(search: DiscoverySearch) {
    setRunning(search.id);
    setRunResults((prev) => {
      const n = { ...prev };
      delete n[search.id];
      return n;
    });
    const res = await fetch(`/api/admin/discover/${search.id}/run`, { method: "POST" });
    const result = await res.json();
    setRunning(null);
    if (res.ok) {
      setRunResults((prev) => ({ ...prev, [search.id]: result }));
      setSearches((prev) =>
        prev.map((s) =>
          s.id === search.id
            ? { ...s, lastRunAt: new Date().toISOString(), lastFoundCount: result.added, totalAdded: s.totalAdded + result.added }
            : s
        )
      );
    } else {
      setRunResults((prev) => ({ ...prev, [search.id]: { added: 0, skipped: 0, errors: [result.error ?? "Unknown error"] } }));
    }
  }

  function toggleTag(tag: string) {
    setTagsToApply((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Each search config runs daily at 9 AM IST and imports new F&B businesses from Google Maps.
            Duplicates are automatically skipped.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          {showForm ? "Cancel" : "+ New Search"}
        </button>
      </div>

      {/* API key warning — only shown when key is genuinely missing */}
      {!isConfigured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Setup required:</strong> Add <code className="rounded bg-amber-100 px-1">GOOGLE_PLACES_API_KEY</code> to your Vercel environment variables to enable discovery.
          Get a key from <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a> → Enable Places API (New).
        </div>
      )}

      {/* New search form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
          <h3 className="font-semibold text-slate-800">New Discovery Search</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Label *</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. South India Cafes"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Search Query *</label>
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. cafe restaurant bakery"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {PRESET_QUERIES.map((p) => (
                  <button key={p.query} type="button" onClick={() => setQuery(p.query)}
                    className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:border-green-400 hover:text-green-700">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cities * (comma or newline separated)</label>
            <textarea
              value={citiesInput}
              onChange={(e) => setCitiesInput(e.target.value)}
              rows={3}
              placeholder="Bangalore, Hyderabad, Chennai, Mumbai, Pune"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Auto-apply tags to imported leads</label>
            <div className="flex flex-wrap gap-2">
              {LEAD_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    tagsToApply.includes(tag)
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save Search"}
            </button>
          </div>
        </form>
      )}

      {/* Search list */}
      {loading ? (
        <div className="text-sm text-slate-400 py-8 text-center">Loading…</div>
      ) : searches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No discovery searches yet.</p>
          <p className="text-slate-400 text-xs mt-1">Create one above to start finding F&B businesses automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {searches.map((s) => (
            <div key={s.id} className={`rounded-xl border bg-white shadow-sm ${s.isActive ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
              <div className="flex items-start justify-between p-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-800">{s.label}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {s.isActive ? "Active" : "Paused"}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>
                      <span className="font-medium text-slate-700">Query:</span> {s.query}
                    </span>
                    <span>
                      <span className="font-medium text-slate-700">Cities:</span>{" "}
                      {s.cities.join(", ")}
                    </span>
                    {s.tagsToApply.length > 0 && (
                      <span>
                        <span className="font-medium text-slate-700">Tags:</span>{" "}
                        {s.tagsToApply.join(", ")}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-5 text-xs text-slate-500">
                    <span>
                      <span className="font-medium text-slate-700">Total imported:</span>{" "}
                      <span className="text-green-700 font-semibold">{s.totalAdded}</span> leads
                    </span>
                    <span>
                      <span className="font-medium text-slate-700">Last run:</span>{" "}
                      {s.lastRunAt
                        ? `${new Date(s.lastRunAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — ${s.lastFoundCount} new`
                        : "Never"}
                    </span>
                    <span className="text-slate-400">Runs daily at 9 AM IST</span>
                  </div>

                  {/* Run result */}
                  {runResults[s.id] && (
                    <div className={`mt-3 rounded-lg p-3 text-xs ${runResults[s.id].errors.length > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                      {runResults[s.id].errors.length > 0 ? (
                        <>
                          <strong>Errors:</strong> {runResults[s.id].errors.join("; ")}
                          {runResults[s.id].added > 0 && ` (still added ${runResults[s.id].added} leads)`}
                        </>
                      ) : (
                        <>
                          <strong>{runResults[s.id].added} new leads imported</strong>
                          {" · "}
                          {runResults[s.id].skipped} already existed
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  {/* Run Now */}
                  <button
                    onClick={() => handleRun(s)}
                    disabled={running === s.id}
                    className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {running === s.id ? (
                      <>
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Searching…
                      </>
                    ) : (
                      "Run Now"
                    )}
                  </button>

                  {/* Pause/Resume */}
                  <button
                    onClick={() => toggleActive(s)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {s.isActive ? "Pause" : "Resume"}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setup instructions */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-medium text-slate-700 mb-2">Setup Instructions</p>
        <ol className="list-decimal list-inside space-y-1 text-xs text-slate-500">
          <li>Go to <strong>Google Cloud Console</strong> → Create a project → Enable <strong>Places API (New)</strong></li>
          <li>Create an API key under <strong>APIs & Services → Credentials</strong></li>
          <li>Add it to Vercel as <code className="rounded bg-slate-100 px-1">GOOGLE_PLACES_API_KEY</code></li>
          <li>Optionally add <code className="rounded bg-slate-100 px-1">CRON_SECRET</code> to secure the daily job</li>
          <li>Redeploy — the cron will run automatically every day at 9 AM IST</li>
        </ol>
      </div>
    </div>
  );
}
