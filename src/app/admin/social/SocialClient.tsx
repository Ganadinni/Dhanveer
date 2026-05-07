"use client";

import { useEffect, useState } from "react";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: "📸", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { key: "linkedin",  label: "LinkedIn",  icon: "💼", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "youtube",   label: "YouTube",   icon: "▶️",  color: "bg-red-50 text-red-700 border-red-200" },
  { key: "facebook",  label: "Facebook",  icon: "👥", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
];

const LEAD_TAGS = ["Cafe", "QSR Chain", "Key Account", "Hotels/Bakery/Restaurant", "PAN Asian", "Dessert Stores", "Industrial", "Chef/Consultant", "Distributors", "Export"];

const PRESET_KEYWORDS = [
  "bubble tea", "boba cafe", "specialty coffee", "dessert bar",
  "cloud kitchen", "fine dining", "bakery cafe", "smoothie bar",
];

interface SocialMonitor {
  id: string;
  label: string;
  keywords: string[];
  platforms: string[];
  cities: string[];
  tagsToApply: string[];
  isActive: boolean;
  lastRunAt: string | null;
  lastFoundCount: number;
  totalAdded: number;
}

interface RunResult { added: number; skipped: number; errors: string[]; }

export function SocialClient({ hasSerper, hasAI }: { hasSerper: boolean; hasAI: boolean }) {
  const [monitors, setMonitors]     = useState<SocialMonitor[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [running, setRunning]       = useState<string | null>(null);
  const [runResults, setRunResults] = useState<Record<string, RunResult>>({});

  // Form state
  const [label, setLabel]               = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "linkedin"]);
  const [citiesInput, setCitiesInput]   = useState("");
  const [tagsToApply, setTagsToApply]   = useState<string[]>([]);
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState("");

  useEffect(() => {
    fetch("/api/admin/social-monitor")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setMonitors(d); })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const keywords = keywordsInput.split(/[,\n]+/).map((k) => k.trim()).filter(Boolean);
    const cities   = citiesInput.split(/[,\n]+/).map((c) => c.trim()).filter(Boolean);
    if (!label.trim() || keywords.length === 0 || selectedPlatforms.length === 0 || cities.length === 0) {
      setFormError("Label, at least one keyword, one platform, and one city are required.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/social-monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), keywords, platforms: selectedPlatforms, cities, tagsToApply }),
    });
    setSaving(false);
    if (res.ok) {
      const created = await res.json();
      setMonitors((prev) => [created, ...prev]);
      setShowForm(false);
      setLabel(""); setKeywordsInput(""); setCitiesInput(""); setTagsToApply([]); setSelectedPlatforms(["instagram", "linkedin"]);
    } else {
      const err = await res.json();
      setFormError(err.error ?? "Failed to save");
    }
  }

  async function toggleActive(m: SocialMonitor) {
    const res = await fetch(`/api/admin/social-monitor/${m.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMonitors((prev) => prev.map((x) => x.id === m.id ? updated : x));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this monitor?")) return;
    await fetch(`/api/admin/social-monitor/${id}`, { method: "DELETE" });
    setMonitors((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleRun(m: SocialMonitor) {
    setRunning(m.id);
    setRunResults((prev) => { const n = { ...prev }; delete n[m.id]; return n; });
    const res = await fetch(`/api/admin/social-monitor/${m.id}/run`, { method: "POST" });
    const result = await res.json();
    setRunning(null);
    setRunResults((prev) => ({ ...prev, [m.id]: result }));
    if (res.ok) {
      setMonitors((prev) => prev.map((x) => x.id === m.id
        ? { ...x, lastRunAt: new Date().toISOString(), lastFoundCount: result.added, totalAdded: x.totalAdded + result.added }
        : x
      ));
    }
  }

  function togglePlatform(key: string) {
    setSelectedPlatforms((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]);
  }

  function toggleTag(tag: string) {
    setTagsToApply((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  const missingKeys = !hasSerper || !hasAI;

  return (
    <div className="max-w-4xl space-y-6">

      {/* Missing keys warning */}
      {missingKeys && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-1">
          <p className="font-semibold">Setup required to enable social monitoring:</p>
          {!hasSerper && <p>• Add <code className="bg-amber-100 px-1 rounded">SERPER_API_KEY</code> — get a free key at <span className="underline">serper.dev</span> (2,500 free searches/month)</p>}
          {!hasAI    && <p>• Add <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> — needed to extract business names from search results</p>}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Searches Google-indexed public profiles across platforms. Each run uses ~{" "}
          <span className="font-medium text-slate-700">platforms × cities</span> Serper queries.
        </p>
        <button onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          {showForm ? "Cancel" : "+ New Monitor"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
          <h3 className="font-semibold text-slate-800">New Social Monitor</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Label *</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Bangalore Bubble Tea Cafes"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cities * (comma or newline separated)</label>
              <input value={citiesInput} onChange={(e) => setCitiesInput(e.target.value)} placeholder="Bangalore, Hyderabad, Chennai"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Keywords / Hashtags * (comma separated)</label>
            <input value={keywordsInput} onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="bubble tea, boba cafe, specialty coffee, dessert bar"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESET_KEYWORDS.map((kw) => (
                <button key={kw} type="button"
                  onClick={() => setKeywordsInput((v) => v ? `${v}, ${kw}` : kw)}
                  className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 hover:border-green-400 hover:text-green-700">
                  + {kw}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Platforms *</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button key={p.key} type="button" onClick={() => togglePlatform(p.key)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedPlatforms.includes(p.key) ? p.color : "border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Auto-apply tags to imported leads</label>
            <div className="flex flex-wrap gap-2">
              {LEAD_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    tagsToApply.includes(tag) ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}>
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
              {saving ? "Saving…" : "Save Monitor"}
            </button>
          </div>
        </form>
      )}

      {/* Monitor list */}
      {loading ? (
        <div className="text-sm text-slate-400 py-8 text-center">Loading…</div>
      ) : monitors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center space-y-2">
          <p className="text-slate-400 text-sm">No social monitors yet.</p>
          <p className="text-slate-400 text-xs">Create one to start finding F&B leads from social media profiles.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {monitors.map((m) => (
            <div key={m.id} className={`rounded-xl border bg-white shadow-sm ${m.isActive ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
              <div className="flex items-start justify-between p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-slate-800">{m.label}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {m.isActive ? "Active" : "Paused"}
                    </span>
                    <div className="flex gap-1.5">
                      {m.platforms.map((p) => {
                        const pl = PLATFORMS.find((x) => x.key === p);
                        return pl ? (
                          <span key={p} className={`rounded-full border px-2 py-0.5 text-xs font-medium ${pl.color}`}>
                            {pl.icon} {pl.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span><span className="font-medium text-slate-700">Keywords:</span> {m.keywords.join(", ")}</span>
                    <span><span className="font-medium text-slate-700">Cities:</span> {m.cities.join(", ")}</span>
                    {m.tagsToApply.length > 0 && <span><span className="font-medium text-slate-700">Tags:</span> {m.tagsToApply.join(", ")}</span>}
                  </div>

                  <div className="mt-2 flex items-center gap-5 text-xs text-slate-500">
                    <span><span className="font-medium text-slate-700">Total imported:</span> <span className="text-green-700 font-semibold">{m.totalAdded}</span> leads</span>
                    <span><span className="font-medium text-slate-700">Last run:</span>{" "}
                      {m.lastRunAt
                        ? `${new Date(m.lastRunAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — ${m.lastFoundCount} new`
                        : "Never"}
                    </span>
                    <span className="text-slate-400">~{m.platforms.length * m.cities.length} queries per run</span>
                  </div>

                  {runResults[m.id] && (
                    <div className={`mt-3 rounded-lg p-3 text-xs ${runResults[m.id].errors.length > 0 && runResults[m.id].added === 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                      {runResults[m.id].errors.length > 0 && runResults[m.id].added === 0 ? (
                        <><span className="font-semibold">Errors:</span> {runResults[m.id].errors.join("; ")}</>
                      ) : (
                        <>
                          <span className="font-semibold">{runResults[m.id].added} new leads imported</span>
                          {" · "}{runResults[m.id].skipped} already existed
                          {runResults[m.id].errors.length > 0 && <span className="text-amber-700 ml-2">· {runResults[m.id].errors.length} partial errors</span>}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button onClick={() => handleRun(m)} disabled={running === m.id || missingKeys}
                    className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5">
                    {running === m.id ? (
                      <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Searching…</>
                    ) : "Run Now"}
                  </button>
                  <button onClick={() => toggleActive(m)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                    {m.isActive ? "Pause" : "Resume"}
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-medium text-slate-700 mb-2">How it works</p>
        <ol className="list-decimal list-inside space-y-1 text-xs text-slate-500">
          <li>For each platform + city combination, Serper searches Google-indexed public profiles matching your keywords</li>
          <li>Claude reads the results and extracts genuine F&B businesses — ignoring personal accounts and directories</li>
          <li>New leads are created with the social profile URL and handle saved in notes</li>
          <li>Duplicates (same business name + city) are automatically skipped</li>
          <li>Get a free Serper key at <span className="text-slate-700 font-medium">serper.dev</span> — 2,500 searches/month free, then $50/month for 50k</li>
        </ol>
      </div>
    </div>
  );
}
