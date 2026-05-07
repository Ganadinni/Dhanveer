"use client";

import { useState } from "react";

interface Config {
  id?: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
}

export function RasikSettingsClient({ initial }: { initial: Config | null }) {
  const [form, setForm] = useState<Config>(initial ?? { baseUrl: "", apiKey: "", enabled: true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/rasik/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) setSaved(true);
    setSaving(false);
  }

  async function handleTest() {
    if (!form.baseUrl) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/rasik/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: form.baseUrl, apiKey: form.apiKey }),
      });
      const data = await res.json();
      setTestResult({ ok: res.ok, message: res.ok ? "Connection successful!" : (data.error ?? "Connection failed") });
    } catch {
      setTestResult({ ok: false, message: "Could not reach Rasik server" });
    }
    setTesting(false);
  }

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/rasik/webhook`
    : "https://your-dhanveer-domain.vercel.app/api/rasik/webhook";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Connection config */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Rasik Connection</h3>
          <p className="text-xs text-slate-400 mt-0.5">Configure how Dhanveer communicates with Rasik</p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Rasik Base URL</label>
          <input
            value={form.baseUrl}
            onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
            placeholder="https://rasik.vercel.app"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-slate-400 mt-1">The root URL of your Rasik deployment</p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Rasik API Key</label>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            placeholder="rsk_live_xxxxxxxxxxxxx"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-slate-400 mt-1">API key from Rasik admin settings</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            className="w-4 h-4 accent-green-600"
            id="rasik-enabled"
          />
          <label htmlFor="rasik-enabled" className="text-sm text-slate-700 cursor-pointer">Integration enabled</label>
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${testResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            <span>{testResult.ok ? "✅" : "❌"}</span>
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={testing || !form.baseUrl}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {testing ? "Testing…" : "Test Connection"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Webhook info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Rasik → Dhanveer Webhook</h3>
          <p className="text-xs text-slate-400 mt-0.5">Give this URL to Rasik so it can push events to Dhanveer</p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Dhanveer Webhook URL</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={webhookUrl}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-600 font-mono"
            />
            <button
              onClick={() => navigator.clipboard.writeText(webhookUrl)}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Copy
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Webhook Secret (RASIK_WEBHOOK_SECRET)</label>
          <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 font-mono">
            Set <code>RASIK_WEBHOOK_SECRET</code> in Dhanveer&apos;s Vercel environment variables to secure the webhook.
            Rasik must send this as the <code>x-rasik-secret</code> header.
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 text-xs space-y-2">
          <p className="font-medium text-slate-700">Supported Events from Rasik:</p>
          <ul className="space-y-1 text-slate-500">
            <li><code className="bg-white px-1 rounded">LEAD_QUALIFIED</code> — Moves lead to QUALIFIED status</li>
            <li><code className="bg-white px-1 rounded">PRODUCT_ENQUIRY</code> — Logs product enquiry as activity</li>
            <li><code className="bg-white px-1 rounded">ORDER_PLACED</code> — Marks lead as WON</li>
            <li><code className="bg-white px-1 rounded">CHAT_ENDED</code> — Logs conversation summary</li>
            <li><code className="bg-white px-1 rounded">NEW_CONTACT</code> — Auto-creates lead from Rasik contact</li>
          </ul>
        </div>
      </div>

      {/* Rasik → Dhanveer API */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Dhanveer API for Rasik</h3>
          <p className="text-xs text-slate-400 mt-0.5">Endpoints Rasik can call to query lead data</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 text-xs space-y-2 font-mono">
          <p className="text-slate-700 font-sans font-medium mb-2">Available Endpoints:</p>
          <p className="text-green-700">GET /api/rasik/leads?phone=9876543210</p>
          <p className="text-slate-500 font-sans pl-2">→ Find lead by phone number</p>
          <p className="text-green-700 mt-2">GET /api/rasik/leads?status=QUALIFIED</p>
          <p className="text-slate-500 font-sans pl-2">→ Get leads by status</p>
          <p className="text-green-700 mt-2">POST /api/rasik/webhook</p>
          <p className="text-slate-500 font-sans pl-2">→ Push events to Dhanveer</p>
        </div>

        <p className="text-xs text-slate-400">
          Set <code className="bg-slate-100 px-1 rounded">RASIK_API_KEY</code> in Vercel env vars.
          Rasik must send this as the <code className="bg-slate-100 px-1 rounded">x-api-key</code> header.
        </p>
      </div>
    </div>
  );
}
