"use client";

import { useEffect, useState } from "react";

// ── Shared ─────────────────────────────────────────────────────────────────────

const LEAD_TAGS = ["Cafe", "QSR Chain", "Key Account", "Hotels/Bakery/Restaurant", "PAN Asian", "Dessert Stores", "Industrial", "Chef/Consultant", "Distributors", "Export"];

// ── Google Maps types & constants ──────────────────────────────────────────────

const PRESET_QUERIES: { label: string; query: string }[] = [
  { label: "Cafes & Bubble Tea", query: "cafe bubble tea boba" },
  { label: "Restaurants",        query: "restaurant dining" },
  { label: "Bakeries & Desserts",query: "bakery dessert patisserie" },
  { label: "Hotels & Resorts",   query: "hotel resort" },
  { label: "QSR & Fast Food",    query: "fast food qsr food court" },
  { label: "Bars & Lounges",     query: "bar lounge pub" },
];

interface DiscoverySearch {
  id: string; label: string; cities: string[]; query: string;
  tagsToApply: string[]; isActive: boolean; lastRunAt: string | null;
  lastFoundCount: number; totalAdded: number; createdAt: string;
}

// ── Social Monitor types & constants ──────────────────────────────────────────

const PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: "📸", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { key: "linkedin",  label: "LinkedIn",  icon: "💼", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "youtube",   label: "YouTube",   icon: "▶️",  color: "bg-red-50 text-red-700 border-red-200" },
  { key: "facebook",  label: "Facebook",  icon: "👥", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
];

const PRESET_KEYWORDS = [
  "bubble tea", "boba cafe", "specialty coffee", "dessert bar",
  "cloud kitchen", "fine dining", "bakery cafe", "smoothie bar",
];

interface SocialMonitor {
  id: string; label: string; keywords: string[]; platforms: string[];
  cities: string[]; tagsToApply: string[]; isActive: boolean;
  lastRunAt: string | null; lastFoundCount: number; totalAdded: number;
}

// ── Shared run result ──────────────────────────────────────────────────────────

interface RunResult { added: number; skipped: number; errors: string[]; }

interface DiscoveryRunLog {
  id: string; searchLabel: string; searchType: string; status: string;
  added: number; skipped: number; errors: string[];
  startedAt: string; completedAt: string | null; runBy: string | null;
}

// ── Run log panel (polls while any run is RUNNING) ─────────────────────────────

function RunsPanel() {
  const [runs, setRuns] = useState<DiscoveryRunLog[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const res = await fetch("/api/admin/discover/runs");
        if (!res.ok || !active) return;
        const data = await res.json();
        if (Array.isArray(data)) setRuns(data);
        // Keep polling if any run is still RUNNING
        if (data.some((r: DiscoveryRunLog) => r.status === "RUNNING")) {
          setTimeout(poll, 4000);
        }
      } catch { /* ignore */ }
    }
    poll();
    return () => { active = false; };
  }, []);

  // Re-poll when a new run starts
  useEffect(() => {
    const hasRunning = runs.some((r) => r.status === "RUNNING");
    if (!hasRunning) return;
    const t = setTimeout(async () => {
      const res = await fetch("/api/admin/discover/runs").catch(() => null);
      if (res?.ok) { const d = await res.json(); if (Array.isArray(d)) setRuns(d); }
    }, 4000);
    return () => clearTimeout(t);
  }, [runs]);

  if (runs.length === 0) return null;

  const activeRun = runs.find((r) => r.status === "RUNNING");
  const visible = expanded ? runs : runs.slice(0, 5);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          {activeRun ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Search running in background — you can work on other things
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-600">Recent Runs</span>
          )}
        </div>
        <button onClick={() => setExpanded(v => !v)} className="text-xs text-slate-400 hover:text-slate-600">
          {expanded ? "Show less" : `All ${runs.length}`}
        </button>
      </div>
      <div className="divide-y divide-slate-50">
        {visible.map((run) => {
          const dur = run.completedAt
            ? Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
            : null;
          return (
            <div key={run.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                run.status === "RUNNING"   ? "bg-amber-400 animate-pulse" :
                run.status === "COMPLETED" ? "bg-green-500" : "bg-red-400"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{run.searchLabel}</p>
                <p className="text-[10px] text-slate-400">
                  {run.status === "RUNNING" ? "Running…" : (
                    <>
                      {run.status === "COMPLETED"
                        ? <span className="text-green-600 font-medium">+{run.added} leads</span>
                        : <span className="text-red-500">Failed</span>
                      }
                      {run.skipped > 0 && <span> · {run.skipped} skipped</span>}
                      {dur !== null && <span> · {dur}s</span>}
                      {" · "}{new Date(run.startedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </>
                  )}
                </p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                run.searchType === "MAPS" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
              }`}>{run.searchType}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DiscoverClient({
  isConfigured, hasSerper, hasAI,
}: {
  isConfigured: boolean; hasSerper: boolean; hasAI: boolean;
}) {
  const [tab, setTab] = useState<"maps" | "social">("maps");

  return (
    <div className="max-w-4xl space-y-5">
      {/* Live run log — always visible, polls automatically */}
      <RunsPanel />

      {/* Tab switcher */}
      <div className="flex border-b border-slate-200">
        <TabBtn active={tab === "maps"}   onClick={() => setTab("maps")}   icon="🗺️" label="Google Maps" />
        <TabBtn active={tab === "social"} onClick={() => setTab("social")} icon="📡" label="Social Media" />
      </div>

      {tab === "maps"   && <MapsTab   isConfigured={isConfigured} />}
      {tab === "social" && <SocialTab hasSerper={hasSerper} hasAI={hasAI} />}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
        active ? "border-green-500 text-green-700" : "border-transparent text-slate-500 hover:text-slate-700"
      }`}>
      {icon} {label}
    </button>
  );
}

// ── Google Maps Tab ────────────────────────────────────────────────────────────

function MapsTab({ isConfigured }: { isConfigured: boolean }) {
  const [searches, setSearches] = useState<DiscoverySearch[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [running, setRunning]   = useState<string | null>(null);
  const [runResults, setRunResults] = useState<Record<string, RunResult>>({});

  const [label, setLabel]           = useState("");
  const [citiesInput, setCitiesInput] = useState("");
  const [query, setQuery]           = useState("");
  const [tagsToApply, setTagsToApply] = useState<string[]>([]);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");

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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), cities, query: query.trim(), tagsToApply }),
    });
    setSaving(false);
    if (res.ok) {
      const created = await res.json();
      setSearches((prev) => [created, ...prev]);
      setShowForm(false);
      setLabel(""); setCitiesInput(""); setQuery(""); setTagsToApply([]);
    } else {
      setFormError((await res.json()).error ?? "Failed to save");
    }
  }

  async function toggleActive(s: DiscoverySearch) {
    const res = await fetch(`/api/admin/discover/${s.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    if (res.ok) { const u = await res.json(); setSearches((prev) => prev.map((x) => x.id === s.id ? u : x)); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this discovery search?")) return;
    await fetch(`/api/admin/discover/${id}`, { method: "DELETE" });
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleRun(s: DiscoverySearch) {
    setRunning(s.id);
    setRunResults((prev) => { const n = { ...prev }; delete n[s.id]; return n; });
    // keepalive keeps the request alive even if the user navigates away
    fetch(`/api/admin/discover/${s.id}/run`, { method: "POST", keepalive: true })
      .then((res) => res.json())
      .then((result) => {
        setRunning(null);
        if (result.added !== undefined) {
          setRunResults((prev) => ({ ...prev, [s.id]: result }));
          setSearches((prev) => prev.map((x) => x.id === s.id
            ? { ...x, lastRunAt: new Date().toISOString(), lastFoundCount: result.added, totalAdded: x.totalAdded + result.added }
            : x
          ));
        } else {
          setRunResults((prev) => ({ ...prev, [s.id]: { added: 0, skipped: 0, errors: [result.error ?? "Unknown error"] } }));
        }
      })
      .catch(() => setRunning(null));
    // UI is immediately available — run log panel shows live status
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">Searches Google Maps for F&B businesses and imports them as leads. Runs daily at 9 AM IST automatically.</p>
          {!isConfigured && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
              Add <code className="bg-amber-100 px-1 rounded">GOOGLE_PLACES_API_KEY</code> in Vercel to enable. Get one from Google Cloud Console → Enable Places API (New).
            </p>
          )}
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          {showForm ? "Cancel" : "+ New Search"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm">New Google Maps Search</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Label *</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. South India Cafes"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Search Query *</label>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. cafe restaurant bakery"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {PRESET_QUERIES.map((p) => (
                  <button key={p.query} type="button" onClick={() => setQuery(p.query)}
                    className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:border-green-400 hover:text-green-700">{p.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cities * (comma separated)</label>
            <input value={citiesInput} onChange={(e) => setCitiesInput(e.target.value)}
              placeholder="Bangalore, Hyderabad, Chennai, Mumbai, Pune"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <TagPicker selected={tagsToApply} onChange={setTagsToApply} />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">{saving ? "Saving…" : "Save Search"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
      ) : searches.length === 0 ? (
        <EmptyState message="No Google Maps searches yet." sub="Create one above to start finding F&B businesses automatically." />
      ) : (
        <div className="space-y-3">
          {searches.map((s) => (
            <DiscoveryCard key={s.id} label={s.label} meta={[
              { k: "Query", v: s.query },
              { k: "Cities", v: s.cities.join(", ") },
              ...(s.tagsToApply.length ? [{ k: "Tags", v: s.tagsToApply.join(", ") }] : []),
            ]}
              isActive={s.isActive} totalAdded={s.totalAdded} lastRunAt={s.lastRunAt}
              lastFoundCount={s.lastFoundCount} runNote="Runs daily at 9 AM IST"
              runResult={runResults[s.id]} running={running === s.id}
              onRun={() => handleRun(s)} onToggle={() => toggleActive(s)} onDelete={() => handleDelete(s.id)}
              badges={null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Social Media Tab ───────────────────────────────────────────────────────────

function SocialTab({ hasSerper, hasAI }: { hasSerper: boolean; hasAI: boolean }) {
  const [monitors, setMonitors]   = useState<SocialMonitor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [running, setRunning]     = useState<string | null>(null);
  const [runResults, setRunResults] = useState<Record<string, RunResult>>({});

  const [label, setLabel]                 = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "linkedin"]);
  const [citiesInput, setCitiesInput]     = useState("");
  const [tagsToApply, setTagsToApply]     = useState<string[]>([]);
  const [saving, setSaving]               = useState(false);
  const [formError, setFormError]         = useState("");

  const missingKeys = !hasSerper || !hasAI;

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
      setFormError("Label, keywords, platforms, and cities are all required.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/social-monitor", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), keywords, platforms: selectedPlatforms, cities, tagsToApply }),
    });
    setSaving(false);
    if (res.ok) {
      const created = await res.json();
      setMonitors((prev) => [created, ...prev]);
      setShowForm(false);
      setLabel(""); setKeywordsInput(""); setCitiesInput(""); setTagsToApply([]); setSelectedPlatforms(["instagram", "linkedin"]);
    } else {
      setFormError((await res.json()).error ?? "Failed to save");
    }
  }

  async function toggleActive(m: SocialMonitor) {
    const res = await fetch(`/api/admin/social-monitor/${m.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    if (res.ok) { const u = await res.json(); setMonitors((prev) => prev.map((x) => x.id === m.id ? u : x)); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this monitor?")) return;
    await fetch(`/api/admin/social-monitor/${id}`, { method: "DELETE" });
    setMonitors((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleRun(m: SocialMonitor) {
    setRunning(m.id);
    setRunResults((prev) => { const n = { ...prev }; delete n[m.id]; return n; });
    fetch(`/api/admin/social-monitor/${m.id}/run`, { method: "POST", keepalive: true })
      .then((res) => res.json())
      .then((result) => {
        setRunning(null);
        setRunResults((prev) => ({ ...prev, [m.id]: result }));
        if (result.added !== undefined) {
          setMonitors((prev) => prev.map((x) => x.id === m.id
            ? { ...x, lastRunAt: new Date().toISOString(), lastFoundCount: result.added, totalAdded: x.totalAdded + result.added }
            : x
          ));
        }
      })
      .catch(() => setRunning(null));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">Searches Google-indexed public profiles on Instagram, LinkedIn, YouTube and Facebook. Each run uses ~platforms × cities Serper queries.</p>
          {missingKeys && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-0.5">
              {!hasSerper && <p>• Add <code className="bg-amber-100 px-1 rounded">SERPER_API_KEY</code> — free at serper.dev (2,500 searches/month)</p>}
              {!hasAI    && <p>• Add <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> — needed to extract business names from results</p>}
            </div>
          )}
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          {showForm ? "Cancel" : "+ New Monitor"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm">New Social Monitor</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Label *</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Bangalore Bubble Tea Cafes"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cities * (comma separated)</label>
              <input value={citiesInput} onChange={(e) => setCitiesInput(e.target.value)} placeholder="Bangalore, Hyderabad, Chennai"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Keywords / Hashtags * (comma separated)</label>
            <input value={keywordsInput} onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="bubble tea, boba cafe, specialty coffee"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {PRESET_KEYWORDS.map((kw) => (
                <button key={kw} type="button"
                  onClick={() => setKeywordsInput((v) => v ? `${v}, ${kw}` : kw)}
                  className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 hover:border-green-400 hover:text-green-700">
                  + {kw}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Platforms *</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button key={p.key} type="button"
                  onClick={() => setSelectedPlatforms((prev) => prev.includes(p.key) ? prev.filter((x) => x !== p.key) : [...prev, p.key])}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedPlatforms.includes(p.key) ? p.color : "border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>
          <TagPicker selected={tagsToApply} onChange={setTagsToApply} />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">{saving ? "Saving…" : "Save Monitor"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
      ) : monitors.length === 0 ? (
        <EmptyState message="No social monitors yet." sub="Create one above to start finding leads from social media profiles." />
      ) : (
        <div className="space-y-3">
          {monitors.map((m) => (
            <DiscoveryCard key={m.id} label={m.label} meta={[
              { k: "Keywords", v: m.keywords.join(", ") },
              { k: "Cities", v: m.cities.join(", ") },
              ...(m.tagsToApply.length ? [{ k: "Tags", v: m.tagsToApply.join(", ") }] : []),
            ]}
              isActive={m.isActive} totalAdded={m.totalAdded} lastRunAt={m.lastRunAt}
              lastFoundCount={m.lastFoundCount} runNote={`~${m.platforms.length * m.cities.length} queries per run`}
              runResult={runResults[m.id]} running={running === m.id}
              onRun={() => handleRun(m)} onToggle={() => toggleActive(m)} onDelete={() => handleDelete(m.id)}
              badges={
                <div className="flex gap-1.5 flex-wrap">
                  {m.platforms.map((p) => {
                    const pl = PLATFORMS.find((x) => x.key === p);
                    return pl ? <span key={p} className={`rounded-full border px-2 py-0.5 text-xs font-medium ${pl.color}`}>{pl.icon} {pl.label}</span> : null;
                  })}
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function TagPicker({ selected, onChange }: { selected: string[]; onChange: (t: string[]) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">Auto-apply tags to imported leads</label>
      <div className="flex flex-wrap gap-1.5">
        {LEAD_TAGS.map((tag) => (
          <button key={tag} type="button"
            onClick={() => onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag])}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
              selected.includes(tag) ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}>
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center space-y-1">
      <p className="text-slate-400 text-sm">{message}</p>
      <p className="text-slate-400 text-xs">{sub}</p>
    </div>
  );
}

function DiscoveryCard({
  label, meta, isActive, totalAdded, lastRunAt, lastFoundCount,
  runNote, runResult, running, onRun, onToggle, onDelete, badges,
}: {
  label: string;
  meta: { k: string; v: string }[];
  isActive: boolean;
  totalAdded: number;
  lastRunAt: string | null;
  lastFoundCount: number;
  runNote: string;
  runResult?: RunResult;
  running: boolean;
  onRun: () => void;
  onToggle: () => void;
  onDelete: () => void;
  badges: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border bg-white shadow-sm ${isActive ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
      <div className="flex items-start justify-between p-5 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-slate-800 text-sm">{label}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
              {isActive ? "Active" : "Paused"}
            </span>
            {badges}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 mb-2">
            {meta.map(({ k, v }) => <span key={k}><span className="font-medium text-slate-700">{k}:</span> {v}</span>)}
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <span><span className="font-medium text-slate-700">Total imported:</span> <span className="text-green-700 font-semibold">{totalAdded}</span> leads</span>
            <span>
              <span className="font-medium text-slate-700">Last run:</span>{" "}
              {lastRunAt ? `${new Date(lastRunAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — ${lastFoundCount} new` : "Never"}
            </span>
            <span className="text-slate-400">{runNote}</span>
          </div>
          {runResult && (
            <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${runResult.errors.length > 0 && runResult.added === 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {runResult.errors.length > 0 && runResult.added === 0
                ? <><span className="font-semibold">Errors:</span> {runResult.errors.join("; ")}</>
                : <><span className="font-semibold">{runResult.added} new leads imported</span> · {runResult.skipped} already existed{runResult.errors.length > 0 && <span className="text-amber-700 ml-2">· {runResult.errors.length} partial errors</span>}</>
              }
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onRun} disabled={running}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5">
            {running
              ? <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Searching…</>
              : "Run Now"}
          </button>
          <button onClick={onToggle} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">{isActive ? "Pause" : "Resume"}</button>
          <button onClick={onDelete} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">Delete</button>
        </div>
      </div>
    </div>
  );
}
