"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TaskType = "CALL" | "FOLLOW_UP" | "MEETING" | "EMAIL" | "OTHER";
const TASK_TYPE_ICONS: Record<TaskType, string> = {
  CALL: "📞", FOLLOW_UP: "🔔", MEETING: "🤝", EMAIL: "✉️", OTHER: "📌",
};
const TASK_TYPE_LABELS: Record<TaskType, string> = {
  CALL: "Call", FOLLOW_UP: "Follow-up", MEETING: "Meeting", EMAIL: "Email", OTHER: "Other",
};

const LEAD_TAGS = [
  "Cafe", "QSR Chain", "Key Account", "Hotels/Bakery/Restaurant",
  "PAN Asian", "Dessert Stores", "Industrial", "Chef/Consultant", "Distributors", "Export",
] as const;

const TAG_COLORS: Record<string, string> = {
  "Cafe":                     "bg-amber-50 text-amber-700 ring-amber-200",
  "QSR Chain":                "bg-orange-50 text-orange-700 ring-orange-200",
  "Key Account":              "bg-purple-50 text-purple-700 ring-purple-200",
  "Hotels/Bakery/Restaurant": "bg-blue-50 text-blue-700 ring-blue-200",
  "PAN Asian":                "bg-red-50 text-red-700 ring-red-200",
  "Dessert Stores":           "bg-pink-50 text-pink-700 ring-pink-200",
  "Industrial":               "bg-slate-100 text-slate-700 ring-slate-300",
  "Chef/Consultant":          "bg-teal-50 text-teal-700 ring-teal-200",
  "Distributors":             "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "Export":                   "bg-green-50 text-green-700 ring-green-200",
};

interface Task {
  id: string; title: string; type: TaskType; dueDate: string | null; completed: boolean; notes: string | null;
}

type Activity = { id: string; type: string; note?: string | null; createdAt: string };

const STATUS_OPTIONS = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700", CONTACTED: "bg-yellow-50 text-yellow-700",
  QUALIFIED: "bg-purple-50 text-purple-700", PROPOSAL_SENT: "bg-orange-50 text-orange-700",
  NEGOTIATION: "bg-pink-50 text-pink-700", WON: "bg-green-50 text-green-700", LOST: "bg-red-50 text-red-700",
};

const ACTIVITY_ICONS: Record<string, string> = {
  NOTE: "📝", CALL: "📞", WHATSAPP_SENT: "💬", WHATSAPP_RECEIVED: "💬", EMAIL: "✉️", VISIT: "🏢",
};

interface ResearchResult {
  businessProfile: string;
  socialMedia: string;
  menuInsights: string;
  seasonalOpportunities: string;
  recommendedProducts: string;
  recipeIdeas: string;
  areaInsights: string;
  pitchAngles: string;
  quickLinks: string[];
  summary: string;
}

interface Lead {
  id: string; businessName: string; ownerName?: string | null; phone?: string | null; email?: string | null;
  address?: string | null; city?: string | null; state?: string | null; pincode?: string | null;
  status: string; source: string; notes?: string | null; tags: string[];
  assignedTo?: { id?: string; name: string } | null; assignedToId?: string | null;
  activities: Activity[]; tasks: Task[];
  score?: { score: number; tier: string; fitScore: number; engageScore: number; intentScore: number; reasoning: string | null } | null;
  researchData?: ResearchResult | null;
  researchedAt?: string | null;
}

interface PitchResult {
  subject: string; pitch: string; whatsappMessage: string;
  recommendedProducts: { id: string; name: string; sku: string | null; category: string; reason: string; mrp: number | null; dealerPrice: number | null; moq: string | null }[];
}

interface UserOption { id: string; name: string; role: string; }

export function LeadDetailClient({ lead, isAdmin = false, users = [], userPermissions = [] }: {
  lead: Lead; isAdmin?: boolean; users?: UserOption[]; userPermissions?: string[];
}) {
  const router = useRouter();
  const canUseAIPitch   = userPermissions.includes("ai_pitch");
  const canResearch     = userPermissions.includes("deep_research");
  const canUseWhatsApp  = userPermissions.includes("whatsapp");
  const canSendEmail    = userPermissions.includes("send_email");
  const canDeleteLeads  = isAdmin || userPermissions.includes("delete_leads");
  const canManageLeads  = isAdmin || userPermissions.includes("manage_leads");

  // Core state
  const [status, setStatus]           = useState(lead.status);
  const [saving, setSaving]           = useState(false);
  const [note, setNote]               = useState("");
  const [addingNote, setAddingNote]   = useState(false);
  const [activities, setActivities]   = useState<Activity[]>(lead.activities);
  const [tasks, setTasks]             = useState<Task[]>(lead.tasks ?? []);
  const [assignedToId, setAssignedToId] = useState(lead.assignedToId ?? "");
  const [taskTitle, setTaskTitle]     = useState("");
  const [taskType, setTaskType]       = useState<TaskType>("FOLLOW_UP");
  const [taskDue, setTaskDue]         = useState("");
  const [addingTask, setAddingTask]   = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Tags state
  const [tags, setTags]               = useState<string[]>(lead.tags ?? []);

  // WhatsApp state
  const [waMessage, setWaMessage]     = useState("");
  const [sendingWa, setSendingWa]     = useState(false);
  const [waError, setWaError]         = useState("");

  // Email state
  const [emailOpen, setEmailOpen]     = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody]     = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError]   = useState("");

  // AI Pitch state
  const [pitch, setPitch]             = useState<PitchResult | null>(null);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchOpen, setPitchOpen]     = useState(false);
  const [pitchTab, setPitchTab]       = useState<"email" | "whatsapp" | "products">("email");
  const [leadScore, setLeadScore]     = useState(lead.score ?? null);

  // Research state — pre-populated from DB if already researched
  const [research, setResearch]       = useState<ResearchResult | null>(lead.researchData ?? null);
  const [researching, setResearching] = useState(false);
  const [researchOpen, setResearchOpen] = useState(!!lead.researchData);
  const [researchError, setResearchError] = useState("");

  const waConversation = activities.filter((a) => a.type === "WHATSAPP_SENT" || a.type === "WHATSAPP_RECEIVED");
  const emailHistory   = activities.filter((a) => a.type === "EMAIL");

  // ── Tags ────────────────────────────────────────────────────────────────────
  async function toggleTag(tag: string) {
    const newTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    setTags(newTags);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: newTags }),
    });
  }

  // ── AI ──────────────────────────────────────────────────────────────────────
  async function generatePitch() {
    setGeneratingPitch(true); setPitchOpen(true);
    const res = await fetch("/api/ai/pitch", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });
    if (res.ok) setPitch(await res.json());
    setGeneratingPitch(false);
  }

  async function refreshScore() {
    const res = await fetch("/api/ai/score", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });
    if (res.ok) setLeadScore(await res.json());
  }

  async function runResearch() {
    setResearching(true); setResearchOpen(true); setResearchError(""); setResearch(null);
    try {
      const res = await fetch("/api/ai/research", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setResearch(data);
        setActivities((prev) => [{
          id: crypto.randomUUID(), type: "NOTE",
          note: `🔍 Deep Research completed. ${data.summary ?? ""}`,
          createdAt: new Date().toISOString(),
        }, ...prev]);
        // Refresh score since research triggers re-scoring on the server
        fetch("/api/ai/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) })
          .then(r => r.ok ? r.json() : null).then(s => { if (s) setLeadScore(s); }).catch(() => null);
      } else {
        setResearchError(data.error ?? `Research failed (${res.status})`);
      }
    } catch {
      setResearchError("Network error — could not reach the server");
    }
    setResearching(false);
  }

  // ── WhatsApp ─────────────────────────────────────────────────────────────────
  async function sendWhatsApp() {
    if (!waMessage.trim() || !lead.phone) return;
    setSendingWa(true); setWaError("");
    const res = await fetch("/api/whatsapp/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, to: lead.phone, message: waMessage }),
    });
    const data = await res.json();
    if (res.ok) {
      setActivities((prev) => [{ id: crypto.randomUUID(), type: "WHATSAPP_SENT", note: waMessage, createdAt: new Date().toISOString() }, ...prev]);
      setWaMessage("");
    } else {
      setWaError(data.error ?? "Failed to send");
    }
    setSendingWa(false);
  }

  // ── Email ────────────────────────────────────────────────────────────────────
  async function sendEmail() {
    if (!emailSubject.trim() || !emailBody.trim() || !lead.email) return;
    setSendingEmail(true); setEmailError("");
    const res = await fetch(`/api/leads/${lead.id}/email`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: emailSubject.trim(), body: emailBody.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      const newAct: Activity = { id: crypto.randomUUID(), type: "EMAIL", note: `[${emailSubject}]\n${emailBody}`, createdAt: new Date().toISOString() };
      setActivities((prev) => [newAct, ...prev]);
      setEmailSubject(""); setEmailBody(""); setEmailOpen(false);
    } else {
      setEmailError(data.error ?? "Failed to send email");
    }
    setSendingEmail(false);
  }

  function prefillEmailFromPitch() {
    if (!pitch) return;
    setEmailSubject(pitch.subject);
    setEmailBody(pitch.pitch);
  }

  // ── Lead management ───────────────────────────────────────────────────────────
  async function addTask() {
    if (!taskTitle.trim()) return;
    setAddingTask(true);
    const res = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskTitle, type: taskType, dueDate: taskDue || null, leadId: lead.id }),
    });
    if (res.ok) {
      const json = await res.json();
      setTasks((prev) => [json.task, ...prev]);
      setTaskTitle(""); setTaskDue(""); setTaskType("FOLLOW_UP"); setShowTaskForm(false);
    }
    setAddingTask(false);
  }

  async function completeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: true }) });
  }

  async function updateStatus(newStatus: string) {
    setSaving(true); setStatus(newStatus);
    await fetch(`/api/leads/${lead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    setSaving(false); router.refresh();
  }

  async function addActivity() {
    if (!note.trim()) return;
    setAddingNote(true);
    const res = await fetch(`/api/leads/${lead.id}/activities`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "NOTE", note }),
    });
    if (res.ok) { const json = await res.json(); setActivities((prev) => [json.data, ...prev]); setNote(""); }
    setAddingNote(false);
  }

  async function assignLead(newAssignedToId: string) {
    setAssignedToId(newAssignedToId);
    await fetch(`/api/leads/${lead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignedToId: newAssignedToId || null }) });
  }

  async function deleteLead() {
    if (!canDeleteLeads) return;
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    router.push("/dashboard/leads");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Info card ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{lead.businessName}</h2>
            {isAdmin && <p className="text-sm text-slate-400">Source: {lead.source.replace(/_/g, " ")}</p>}
          </div>
          {canDeleteLeads && (
            <button onClick={deleteLead} className="text-xs text-red-500 hover:text-red-700">Delete lead</button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <Info label="Owner" value={lead.ownerName} />
          <Info label="Phone" value={lead.phone} />
          <Info label="Email" value={lead.email} />
          <Info label="City" value={[lead.city, lead.state, lead.pincode].filter(Boolean).join(", ")} />
          <Info label="Address" value={lead.address} />
          {isAdmin ? (
            <div>
              <p className="text-xs text-slate-400">Assigned to</p>
              <select value={assignedToId} onChange={(e) => assignLead(e.target.value)}
                className="mt-1 text-sm text-slate-700 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 w-full">
                <option value="">— Unassigned —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
          ) : (
            <Info label="Assigned to" value={lead.assignedTo?.name} />
          )}
        </div>

        {lead.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Notes</p>
            <p className="text-sm text-slate-700">{lead.notes}</p>
          </div>
        )}

        {/* Tags */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-2">Tags {!canManageLeads && <span className="text-slate-300">(view only)</span>}</p>
          <div className="flex flex-wrap gap-1.5">
            {LEAD_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => canManageLeads && toggleTag(tag)}
                  disabled={!canManageLeads}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    active
                      ? `ring-1 ${TAG_COLORS[tag]}`
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200"
                  } ${!canManageLeads ? "cursor-default" : "cursor-pointer"}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Status ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">
          Status {saving && <span className="text-slate-400 font-normal">(saving…)</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => updateStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                status === s
                  ? `${STATUS_COLORS[s]} border-transparent ring-2 ring-offset-1 ring-green-400`
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}>{s.replace("_", " ")}</button>
          ))}
        </div>
      </div>

      {/* ── AI Sales Intelligence ──────────────────────────────────────────────── */}
      {!canUseAIPitch && !canResearch ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-medium text-slate-700">AI Sales Intelligence</p>
            <p className="text-xs text-slate-400">Ask your admin to enable AI Pitch & Scoring or Deep Research for your account.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <p className="text-sm font-medium text-slate-800">AI Sales Intelligence</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {leadScore && (
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    leadScore.tier === "HOT" ? "bg-red-100 text-red-700" :
                    leadScore.tier === "WARM" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {leadScore.tier === "HOT" ? "🔥" : leadScore.tier === "WARM" ? "☀️" : "❄️"} {leadScore.tier}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{leadScore.score}/100</span>
                </div>
              )}
              {canResearch && (
                <button onClick={runResearch} disabled={researching}
                  className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                  {researching ? "Searching…" : "🔍 Research"}
                </button>
              )}
              {canUseAIPitch && (
                <button onClick={refreshScore} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5">
                  Score
                </button>
              )}
              {canUseAIPitch && (
                <button onClick={generatePitch} disabled={generatingPitch}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors">
                  {generatingPitch ? "Generating…" : "Generate Pitch"}
                </button>
              )}
            </div>
          </div>

          {/* Score reasoning */}
          {leadScore?.reasoning && (
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs text-slate-500">
                <span className="font-medium">Score reasoning:</span> {leadScore.reasoning}
              </p>
              <div className="flex gap-4 mt-1.5 text-xs text-slate-400">
                <span>Fit: <b className="text-slate-600">{leadScore.fitScore}</b></span>
                <span>Engagement: <b className="text-slate-600">{leadScore.engageScore}</b></span>
                <span>Intent: <b className="text-slate-600">{leadScore.intentScore}</b></span>
              </div>
            </div>
          )}

          {/* Research results */}
          {researchOpen && (
            <div className="border-b border-slate-100">
              {researching ? (
                <div className="flex items-center gap-3 py-6 px-5 justify-center">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Researching {lead.businessName} online…</p>
                </div>
              ) : researchError ? (
                <div className="px-5 py-4">
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{researchError}</p>
                </div>
              ) : research ? (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">🔍 Research Report</p>
                    <button onClick={() => setResearchOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">Hide</button>
                  </div>

                  {research.summary && (
                    <div className="bg-indigo-50 rounded-lg px-4 py-3 text-sm text-indigo-900 border border-indigo-100">
                      {research.summary}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    <ResearchSection icon="🏢" title="Business Profile" content={research.businessProfile} />
                    <ResearchSection icon="📱" title="Social Media" content={research.socialMedia} />
                    <ResearchSection icon="🍽️" title="Menu Insights" content={research.menuInsights} />
                    <ResearchSection icon="🌤️" title="Seasonal Opportunities" content={research.seasonalOpportunities} />
                    <ResearchSection icon="📦" title="Recommended Products" content={research.recommendedProducts} />
                    <ResearchSection icon="🧑‍🍳" title="Recipe Ideas" content={research.recipeIdeas} />
                    <ResearchSection icon="🏙️" title="Area Insights" content={research.areaInsights} />
                    <ResearchSection icon="🎯" title="Pitch Angles" content={research.pitchAngles} />
                  </div>

                  {research.quickLinks?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1.5">Quick Links to Verify</p>
                      <div className="flex flex-wrap gap-2">
                        {research.quickLinks.map((link, i) => {
                          const [label, url] = link.includes(": ") ? link.split(": ") : [link, link];
                          return (
                            <a key={i} href={url?.trim()} target="_blank" rel="noopener noreferrer"
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors">
                              {label?.trim()} ↗
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {canUseAIPitch && (
                    <button onClick={generatePitch} disabled={generatingPitch}
                      className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                      {generatingPitch ? "Generating…" : "Generate Pitch based on Research"}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Pitch results */}
          {pitchOpen && (
            <div className="p-5">
              {generatingPitch ? (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Analysing lead and building pitch…</p>
                </div>
              ) : pitch ? (
                <>
                  <div className="flex gap-1 mb-4 border-b border-slate-100">
                    {(["email", "whatsapp", "products"] as const).map((tab) => (
                      <button key={tab} onClick={() => setPitchTab(tab)}
                        className={`px-4 py-2 text-xs font-medium capitalize border-b-2 transition-colors -mb-px ${
                          pitchTab === tab ? "border-violet-500 text-violet-700" : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}>
                        {tab === "email" ? "📧 Email Pitch" : tab === "whatsapp" ? "💬 WhatsApp" : "📦 Products"}
                      </button>
                    ))}
                  </div>

                  {pitchTab === "email" && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Subject</p>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 text-sm text-slate-800 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{pitch.subject}</p>
                          <button onClick={() => navigator.clipboard.writeText(pitch.subject)} className="text-xs text-slate-400 hover:text-slate-600 shrink-0">Copy</button>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-slate-400">Email Body</p>
                          <div className="flex gap-3">
                            {canSendEmail && (
                              <button onClick={() => { prefillEmailFromPitch(); setEmailOpen(true); setPitchOpen(false); }}
                                className="text-xs text-violet-600 hover:text-violet-800 font-medium">
                                Send this email ↓
                              </button>
                            )}
                            <button onClick={() => navigator.clipboard.writeText(pitch.pitch)} className="text-xs text-slate-400 hover:text-slate-600">Copy all</button>
                          </div>
                        </div>
                        <pre className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg px-4 py-3 border border-slate-100 max-h-64 overflow-y-auto font-sans leading-relaxed">
                          {pitch.pitch}
                        </pre>
                      </div>
                    </div>
                  )}

                  {pitchTab === "whatsapp" && (
                    <div className="space-y-3">
                      <div className="bg-[#f0f7f0] rounded-xl p-4">
                        <div className="bg-white rounded-2xl rounded-br-sm px-4 py-3 text-sm text-slate-800 shadow-sm border border-slate-100 max-w-xs ml-auto whitespace-pre-wrap leading-relaxed">
                          {pitch.whatsappMessage}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {canUseWhatsApp && (
                          <button onClick={() => { setWaMessage(pitch.whatsappMessage); setPitchOpen(false); }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                            Use as WhatsApp Message
                          </button>
                        )}
                        <button onClick={() => navigator.clipboard.writeText(pitch.whatsappMessage)}
                          className="px-4 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-lg">
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  {pitchTab === "products" && (
                    <div className="space-y-2">
                      {pitch.recommendedProducts.map((p) => (
                        <div key={p.id} className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-800">{p.name}</span>
                            {p.sku && <span className="text-xs bg-white text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-mono">{p.sku}</span>}
                            <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded">{p.category}</span>
                          </div>
                          <p className="text-xs text-slate-500">{p.reason}</p>
                          <div className="flex gap-4 mt-1.5 text-xs text-slate-400">
                            {p.mrp != null && <span>MRP: <b className="text-slate-600">₹{p.mrp}</b></span>}
                            {p.dealerPrice != null && <span>Dealer: <b className="text-slate-600">₹{p.dealerPrice}</b></span>}
                            {p.moq && <span>MOQ: <b className="text-slate-600">{p.moq}</b></span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Failed to generate pitch. Try again.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── WhatsApp ──────────────────────────────────────────────────────────── */}
      {!canUseWhatsApp ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-medium text-slate-700">WhatsApp Messaging</p>
            <p className="text-xs text-slate-400">Ask your admin to enable WhatsApp access for your account.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-green-50">
            <span className="text-green-600 text-base">💬</span>
            <p className="text-sm font-medium text-green-800">WhatsApp</p>
            {lead.phone && <span className="text-xs text-green-600 ml-auto">{lead.phone}</span>}
          </div>
          <div className="px-5 py-4 space-y-2 max-h-64 overflow-y-auto bg-[#f0f7f0]">
            {waConversation.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No WhatsApp messages yet</p>
            ) : (
              [...waConversation].reverse().map((a) => {
                const sent = a.type === "WHATSAPP_SENT";
                return (
                  <div key={a.id} className={`flex ${sent ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm ${sent ? "bg-green-600 text-white rounded-br-sm" : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"}`}>
                      <p>{a.note}</p>
                      <p className={`text-[10px] mt-1 ${sent ? "text-green-100" : "text-slate-400"}`}>
                        {new Date(a.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="px-4 py-3 border-t border-slate-100">
            {!lead.phone ? (
              <p className="text-xs text-slate-400 text-center">Add a phone number to this lead to enable WhatsApp</p>
            ) : (
              <>
                <div className="flex gap-2">
                  <input value={waMessage} onChange={(e) => setWaMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendWhatsApp()}
                    placeholder="Type a message…"
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <button onClick={sendWhatsApp} disabled={sendingWa || !waMessage.trim()}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors">
                    {sendingWa ? "…" : "Send"}
                  </button>
                </div>
                {waError && <p className="text-xs text-red-500 mt-1.5 px-1">{waError}</p>}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Email ─────────────────────────────────────────────────────────────── */}
      {!canSendEmail ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-medium text-slate-700">Send Email</p>
            <p className="text-xs text-slate-400">Ask your admin to enable Email for your account.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-blue-50">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-base">✉️</span>
              <p className="text-sm font-medium text-blue-800">Email</p>
              {lead.email && <span className="text-xs text-blue-500">{lead.email}</span>}
            </div>
            <button onClick={() => setEmailOpen((v) => !v)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              {emailOpen ? "Cancel" : lead.email ? "+ Compose" : "No email address"}
            </button>
          </div>

          {/* Email history */}
          {emailHistory.length > 0 && (
            <div className="px-5 py-3 space-y-2 max-h-48 overflow-y-auto">
              {emailHistory.map((a) => {
                const lines = a.note?.split("\n") ?? [];
                const subject = lines[0]?.replace(/^\[/, "").replace(/\]$/, "") ?? "";
                const preview = lines.slice(1).join(" ").slice(0, 100);
                return (
                  <div key={a.id} className="border border-slate-100 rounded-lg px-3 py-2 bg-slate-50">
                    <p className="text-xs font-medium text-slate-700">{subject}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{preview}</p>
                    <p className="text-[10px] text-slate-300 mt-1">
                      {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Compose form */}
          {emailOpen && (
            <div className="p-4 border-t border-slate-100 space-y-3">
              {!lead.email && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">This lead has no email address. Add one to send emails.</p>
              )}
              <div className="flex items-center gap-2">
                <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject…"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {pitch && (
                  <button onClick={prefillEmailFromPitch} className="text-xs text-violet-600 hover:text-violet-800 font-medium whitespace-nowrap">
                    Pre-fill from Pitch
                  </button>
                )}
              </div>
              <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)}
                rows={6} placeholder="Write your email…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              <button onClick={sendEmail} disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim() || !lead.email}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                {sendingEmail ? "Sending…" : `Send Email to ${lead.email ?? "—"}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tasks ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-700">Tasks</p>
          <button onClick={() => setShowTaskForm((v) => !v)} className="text-xs text-green-600 hover:text-green-700 font-medium">+ Add task</button>
        </div>
        {showTaskForm && (
          <div className="mb-4 space-y-2 p-3 bg-slate-50 rounded-lg">
            <input autoFocus value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title…"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
            <div className="flex gap-2">
              <select value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((k) => (
                  <option key={k} value={k}>{TASK_TYPE_ICONS[k]} {TASK_TYPE_LABELS[k]}</option>
                ))}
              </select>
              <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={addTask} disabled={addingTask || !taskTitle.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg">
                {addingTask ? "Saving…" : "Save Task"}
              </button>
              <button onClick={() => setShowTaskForm(false)} className="text-sm text-slate-400 hover:text-slate-600 px-3">Cancel</button>
            </div>
          </div>
        )}
        {tasks.length === 0 && !showTaskForm ? (
          <p className="text-sm text-slate-400">No tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 text-sm group">
                <button onClick={() => completeTask(t.id)} className="w-4 h-4 rounded-full border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 shrink-0" />
                <span className="text-slate-500">{TASK_TYPE_ICONS[t.type]}</span>
                <span className="flex-1 text-slate-800">{t.title}</span>
                {t.dueDate && (
                  <span className="text-xs text-slate-400">{new Date(t.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Activity ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">Activity</p>
        <div className="flex gap-2 mb-4">
          <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addActivity()}
            placeholder="Add a note…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button onClick={addActivity} disabled={addingNote || !note.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 rounded-lg">Add</button>
        </div>
        {activities.length === 0 ? (
          <p className="text-sm text-slate-400">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {activities.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm items-start">
                <span className="text-base shrink-0">{ACTIVITY_ICONS[a.type] ?? "📌"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700">{a.note}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {a.type.replace("_", " ").toLowerCase()} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-slate-700">{value || "—"}</p>
    </div>
  );
}

function ResearchSection({ icon, title, content }: { icon: string; title: string; content: string }) {
  if (!content) return null;
  return (
    <div className="bg-white rounded-lg border border-slate-100 px-3 py-2.5">
      <p className="text-xs font-semibold text-slate-500 mb-1">{icon} {title}</p>
      <p className="text-xs text-slate-600 leading-relaxed">{content}</p>
    </div>
  );
}
