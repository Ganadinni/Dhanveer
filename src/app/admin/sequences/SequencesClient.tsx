"use client";

import { useEffect, useState } from "react";

interface Step {
  id?: string;
  stepNumber: number;
  delayDays: number;
  message: string;
}

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  steps: Step[];
  _count: { enrollments: number };
}

const PLACEHOLDER_VARS = "{name}  {business}  {city}";

const SAMPLE_SEQUENCES = [
  {
    name: "New Lead Welcome",
    description: "3-step intro sequence for newly imported leads",
    steps: [
      { delayDays: 0, message: "Hi {name}, I'm from The Tea Planet — India's first bubble tea manufacturer. We work with cafes and restaurants like {business} to add high-margin beverages to their menu. Happy to share more if you're open to it." },
      { delayDays: 3, message: "Following up, {name}. We have products that fit the kind of menu {business} likely runs — cost per cup under Rs.15, selling at Rs.80-150. Can I send a sample kit to your place in {city}?" },
      { delayDays: 7, message: "Last note from my side, {name}. If the timing isn't right, no problem — I'll check back in a few weeks. If you'd like to see our catalog, just reply and I'll share it. The Tea Planet — +91-8886277713" },
    ],
  },
  {
    name: "Post-Research Follow-up",
    description: "For leads that have been researched and scored",
    steps: [
      { delayDays: 0, message: "Hi {name}, looked into {business} and I think there's a good fit with what we do at The Tea Planet. Specifically thinking about a couple of products that could work well for your customer base in {city}. Can we connect for 10 minutes?" },
      { delayDays: 5, message: "Just following up, {name}. No pressure — whenever you have a moment, I'd love to share what we've been doing for similar businesses in {city}. The Tea Planet — +91-8886277713" },
    ],
  },
];

export function SequencesClient() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<Step[]>([{ stepNumber: 0, delayDays: 0, message: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/sequences")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSequences(d); })
      .finally(() => setLoading(false));
  }, []);

  function openNew() {
    setEditingId(null);
    setName(""); setDescription("");
    setSteps([{ stepNumber: 0, delayDays: 0, message: "" }]);
    setError("");
    setShowForm(true);
  }

  function openEdit(seq: Sequence) {
    setEditingId(seq.id);
    setName(seq.name);
    setDescription(seq.description ?? "");
    setSteps(seq.steps.length > 0 ? seq.steps : [{ stepNumber: 0, delayDays: 0, message: "" }]);
    setError("");
    setShowForm(true);
  }

  function loadSample(sample: typeof SAMPLE_SEQUENCES[0]) {
    setName(sample.name);
    setDescription(sample.description);
    setSteps(sample.steps.map((s, i) => ({ stepNumber: i, ...s })));
  }

  function addStep() {
    setSteps((prev) => [...prev, { stepNumber: prev.length, delayDays: (prev[prev.length - 1]?.delayDays ?? 0) + 3, message: "" }]);
  }

  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stepNumber: idx })));
  }

  function updateStep(i: number, field: "delayDays" | "message", value: string | number) {
    setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: field === "delayDays" ? Number(value) : value } : s));
  }

  async function handleSave() {
    if (!name.trim()) { setError("Name required"); return; }
    if (steps.some((s) => !s.message.trim())) { setError("All steps need a message"); return; }
    setSaving(true); setError("");

    if (editingId) {
      const [nameRes, stepsRes] = await Promise.all([
        fetch(`/api/admin/sequences/${editingId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description }),
        }),
        fetch(`/api/admin/sequences/${editingId}/steps`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ steps }),
        }),
      ]);
      if (nameRes.ok && stepsRes.ok) {
        const updated = await stepsRes.json();
        setSequences((prev) => prev.map((s) => s.id === editingId ? { ...updated, _count: s._count } : s));
        setShowForm(false);
      }
    } else {
      const res = await fetch("/api/admin/sequences", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, steps }),
      });
      if (res.ok) {
        const created = await res.json();
        setSequences((prev) => [{ ...created, _count: { enrollments: 0 } }, ...prev]);
        setShowForm(false);
      }
    }
    setSaving(false);
  }

  async function toggleActive(seq: Sequence) {
    const res = await fetch(`/api/admin/sequences/${seq.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !seq.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSequences((prev) => prev.map((s) => s.id === seq.id ? { ...updated, _count: s._count } : s));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sequence? Enrolled leads will be unaffected until next cron run.")) return;
    await fetch(`/api/admin/sequences/${id}`, { method: "DELETE" });
    setSequences((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Sequences run daily at 4 AM IST. Use {"{name}"}, {"{business}"}, {"{city}"} as placeholders.
        </p>
        <button onClick={openNew} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          + New Sequence
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{editingId ? "Edit Sequence" : "New Sequence"}</h3>
            {!editingId && (
              <div className="flex gap-2">
                <span className="text-xs text-slate-400 mr-1 self-center">Start from template:</span>
                {SAMPLE_SEQUENCES.map((s) => (
                  <button key={s.name} onClick={() => loadSample(s)}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-green-400 hover:text-green-700">
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New Lead Welcome"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Steps · placeholders: {PLACEHOLDER_VARS}</label>
              <button onClick={addStep} className="text-xs text-green-600 hover:text-green-700 font-medium">+ Add step</button>
            </div>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 w-12">Step {i + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-slate-500">Send after</label>
                      <input type="number" min={0} value={step.delayDays}
                        onChange={(e) => updateStep(i, "delayDays", e.target.value)}
                        className="w-14 rounded border border-slate-200 px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-green-500" />
                      <label className="text-xs text-slate-500">days from enrollment</label>
                    </div>
                    {steps.length > 1 && (
                      <button onClick={() => removeStep(i)} className="ml-auto text-xs text-red-400 hover:text-red-600">Remove</button>
                    )}
                  </div>
                  <textarea
                    value={step.message}
                    onChange={(e) => updateStep(i, "message", e.target.value)}
                    rows={3}
                    placeholder="Hi {name}, writing from The Tea Planet…"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-slate-400">{step.message.length} chars</p>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save Sequence"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center text-sm text-slate-400 py-10">Loading…</div>
      ) : sequences.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No sequences yet.</p>
          <p className="text-slate-400 text-xs mt-1">Create one above and enroll leads from the import page or any lead detail.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sequences.map((seq) => (
            <div key={seq.id} className={`rounded-xl border bg-white shadow-sm ${seq.isActive ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-800">{seq.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${seq.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {seq.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    {seq.description && <p className="text-xs text-slate-400 mt-0.5">{seq.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span><strong className="text-slate-700">{seq.steps.length}</strong> steps</span>
                      <span><strong className="text-slate-700">{seq._count.enrollments}</strong> leads enrolled</span>
                      <span>Runs daily at 4 AM IST</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button onClick={() => openEdit(seq)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">Edit</button>
                    <button onClick={() => toggleActive(seq)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                      {seq.isActive ? "Pause" : "Resume"}
                    </button>
                    <button onClick={() => handleDelete(seq.id)}
                      className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">Delete</button>
                  </div>
                </div>

                {/* Step preview */}
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {seq.steps.map((step, i) => (
                    <div key={i} className="shrink-0 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 w-56">
                      <p className="text-xs font-medium text-slate-600">Step {i + 1} · Day {step.delayDays}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{step.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
