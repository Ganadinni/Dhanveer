"use client";

import { useState, useEffect } from "react";
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
  businessProfile: string; socialMedia: string; menuInsights: string;
  seasonalOpportunities: string; recommendedProducts: string; crossSellUpsell: string;
  recipeIdeas: string; areaInsights: string; engagementStrategy: string;
  quickLinks: string[]; summary: string;
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
interface SequenceOption { id: string; name: string; isActive: boolean; steps: unknown[]; }
interface Enrollment {
  id: string; sequenceId: string; currentStep: number; status: string;
  nextSendAt: string | null; enrolledAt: string;
  sequence: { name: string; steps: unknown[] };
}

type TabKey = "intelligence" | "pitch" | "whatsapp" | "email" | "sequences" | "tasks" | "activity";
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "intelligence", label: "Research",   icon: "🔍" },
  { key: "pitch",        label: "Pitch",       icon: "✉️" },
  { key: "whatsapp",     label: "WhatsApp",    icon: "💬" },
  { key: "email",        label: "Email",       icon: "📧" },
  { key: "sequences",    label: "Sequences",   icon: "📲" },
  { key: "tasks",        label: "Tasks",       icon: "✅" },
  { key: "activity",     label: "Activity",    icon: "📝" },
];

export function LeadDetailClient({ lead, isAdmin = false, users = [], userPermissions = [] }: {
  lead: Lead; isAdmin?: boolean; users?: UserOption[]; userPermissions?: string[];
}) {
  const router = useRouter();
  const canUseAIPitch  = userPermissions.includes("ai_pitch");
  const canResearch    = userPermissions.includes("deep_research");
  const canUseWhatsApp = userPermissions.includes("whatsapp");
  const canSendEmail   = userPermissions.includes("send_email");
  const canDeleteLeads = isAdmin || userPermissions.includes("delete_leads");
  const canManageLeads = isAdmin || userPermissions.includes("manage_leads");

  const [activeTab, setActiveTab]         = useState<TabKey>("intelligence");
  const [status, setStatus]               = useState(lead.status);
  const [saving, setSaving]               = useState(false);
  const [note, setNote]                   = useState("");
  const [addingNote, setAddingNote]       = useState(false);
  const [activities, setActivities]       = useState<Activity[]>(lead.activities);
  const [tasks, setTasks]                 = useState<Task[]>(lead.tasks ?? []);
  const [assignedToId, setAssignedToId]   = useState(lead.assignedToId ?? "");
  const [taskTitle, setTaskTitle]         = useState("");
  const [taskType, setTaskType]           = useState<TaskType>("FOLLOW_UP");
  const [taskDue, setTaskDue]             = useState("");
  const [addingTask, setAddingTask]       = useState(false);
  const [showTaskForm, setShowTaskForm]   = useState(false);
  const [tags, setTags]                   = useState<string[]>(lead.tags ?? []);
  const [waMessage, setWaMessage]         = useState("");
  const [sendingWa, setSendingWa]         = useState(false);
  const [waError, setWaError]             = useState("");
  const [emailOpen, setEmailOpen]         = useState(false);
  const [emailSubject, setEmailSubject]   = useState("");
  const [emailBody, setEmailBody]         = useState("");
  const [sendingEmail, setSendingEmail]   = useState(false);
  const [emailError, setEmailError]       = useState("");
  const [pitch, setPitch]                 = useState<PitchResult | null>(null);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchTab, setPitchTab]           = useState<"email" | "whatsapp" | "products">("email");
  const [leadScore, setLeadScore]         = useState(lead.score ?? null);
  const [research, setResearch]           = useState<ResearchResult | null>(lead.researchData ?? null);
  const [researching, setResearching]     = useState(false);
  const [researchError, setResearchError] = useState("");
  const [enrollments, setEnrollments]     = useState<Enrollment[]>([]);
  const [sequences, setSequences]         = useState<SequenceOption[]>([]);
  const [selectedSeqId, setSelectedSeqId] = useState("");
  const [enrolling, setEnrolling]         = useState(false);

  useEffect(() => {
    fetch(`/api/leads/${lead.id}/enroll`)
      .then((r) => r.json()).then((d) => { if (Array.isArray(d)) setEnrollments(d); }).catch(() => {});
    fetch("/api/admin/sequences")
      .then((r) => r.json()).then((d) => { if (Array.isArray(d)) setSequences(d.filter((s: SequenceOption) => s.isActive)); }).catch(() => {});
  }, [lead.id]);

  async function toggleTag(tag: string) {
    const newTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    setTags(newTags);
    await fetch(`/api/leads/${lead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tags: newTags }) });
  }

  async function generatePitch() {
    setGeneratingPitch(true);
    const res = await fetch("/api/ai/pitch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) });
    if (res.ok) setPitch(await res.json());
    setGeneratingPitch(false);
  }

  async function refreshScore() {
    const res = await fetch("/api/ai/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) });
    if (res.ok) setLeadScore(await res.json());
  }

  async function runResearch() {
    setResearching(true); setResearchError(""); setResearch(null);
    try {
      const res = await fetch("/api/ai/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) });
      let data: Record<string, string> | null = null;
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (res.ok && data) {
        setResearch(data as unknown as ResearchResult);
        setActivities((prev) => [{ id: crypto.randomUUID(), type: "NOTE", note: `Deep Research completed. ${(data as Record<string,string>).summary ?? ""}`, createdAt: new Date().toISOString() }, ...prev]);
        fetch("/api/ai/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) })
          .then(r => r.ok ? r.json() : null).then(s => { if (s) setLeadScore(s); }).catch(() => null);
      } else {
        setResearchError(data?.error ?? `Research failed (HTTP ${res.status}) — check that ANTHROPIC_API_KEY is set`);
      }
    } catch (err) {
      setResearchError(`Could not reach server — ${err instanceof Error ? err.message : "unknown error"}`);
    }
    setResearching(false);
  }

  async function sendWhatsApp() {
    if (!waMessage.trim() || !lead.phone) return;
    setSendingWa(true); setWaError("");
    const res = await fetch("/api/whatsapp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id, to: lead.phone, message: waMessage }) });
    const data = await res.json();
    if (res.ok) { setActivities((prev) => [{ id: crypto.randomUUID(), type: "WHATSAPP_SENT", note: waMessage, createdAt: new Date().toISOString() }, ...prev]); setWaMessage(""); }
    else setWaError(data.error ?? "Failed to send");
    setSendingWa(false);
  }

  async function sendEmail() {
    if (!emailSubject.trim() || !emailBody.trim() || !lead.email) return;
    setSendingEmail(true); setEmailError("");
    const res = await fetch(`/api/leads/${lead.id}/email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: emailSubject.trim(), body: emailBody.trim() }) });
    const data = await res.json();
    if (res.ok) { setActivities((prev) => [{ id: crypto.randomUUID(), type: "EMAIL", note: `[${emailSubject}]\n${emailBody}`, createdAt: new Date().toISOString() }, ...prev]); setEmailSubject(""); setEmailBody(""); setEmailOpen(false); }
    else setEmailError(data.error ?? "Failed to send email");
    setSendingEmail(false);
  }

  async function addTask() {
    if (!taskTitle.trim()) return;
    setAddingTask(true);
    const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: taskTitle, type: taskType, dueDate: taskDue || null, leadId: lead.id }) });
    if (res.ok) { const json = await res.json(); setTasks((prev) => [json.task, ...prev]); setTaskTitle(""); setTaskDue(""); setTaskType("FOLLOW_UP"); setShowTaskForm(false); }
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
    const res = await fetch(`/api/leads/${lead.id}/activities`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "NOTE", note }) });
    if (res.ok) { const json = await res.json(); setActivities((prev) => [json.data, ...prev]); setNote(""); }
    setAddingNote(false);
  }

  async function assignLead(newId: string) {
    setAssignedToId(newId);
    await fetch(`/api/leads/${lead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignedToId: newId || null }) });
  }

  async function enrollInSequence() {
    if (!selectedSeqId) return;
    setEnrolling(true);
    const res = await fetch(`/api/leads/${lead.id}/enroll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sequenceId: selectedSeqId }) });
    if (res.ok) { const data = await res.json(); setEnrollments((prev) => { const e = prev.find(e => e.sequenceId === selectedSeqId); return e ? prev.map(x => x.sequenceId === selectedSeqId ? data : x) : [data, ...prev]; }); setSelectedSeqId(""); }
    setEnrolling(false);
  }

  async function updateEnrollmentStatus(enrollmentId: string, status: string) {
    const res = await fetch(`/api/leads/${lead.id}/enroll`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enrollmentId, status }) });
    if (res.ok) { const data = await res.json(); setEnrollments((prev) => prev.map(e => e.id === enrollmentId ? data : e)); }
  }

  async function deleteLead() {
    if (!canDeleteLeads) return;
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    router.push("/dashboard/leads");
  }

  const waConversation = activities.filter((a) => a.type === "WHATSAPP_SENT" || a.type === "WHATSAPP_RECEIVED");
  const emailHistory   = activities.filter((a) => a.type === "EMAIL");
  const tierColor = leadScore?.tier === "HOT" ? "bg-red-100 text-red-700" : leadScore?.tier === "WARM" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500";
  const tierIcon  = leadScore?.tier === "HOT" ? "🔥" : leadScore?.tier === "WARM" ? "☀️" : "❄️";

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0">

      {/* ── LEFT PANEL — Lead card ─────────────────────────────────────────────── */}
      <div className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col overflow-y-auto max-h-[45vh] lg:max-h-none">

        {/* Name + score */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h2 className="text-sm font-semibold text-slate-900 leading-snug flex-1">{lead.businessName}</h2>
            {leadScore && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${tierColor}`}>
                {tierIcon} {leadScore.tier}
              </span>
            )}
          </div>
          {(lead.city || lead.state) && (
            <p className="text-xs text-slate-400">{[lead.city, lead.state].filter(Boolean).join(", ")}</p>
          )}
          {isAdmin && <p className="text-xs text-slate-300 mt-0.5">{lead.source.replace(/_/g, " ")}</p>}
        </div>

        {/* Status */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-400 mb-1.5">Status {saving && <span className="text-slate-300">(saving…)</span>}</p>
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((s) => (
              <button key={s} onClick={() => updateStatus(s)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                  status === s ? `${STATUS_COLORS[s]} ring-1 ring-offset-1 ring-green-300` : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Contact details */}
        <div className="px-4 py-3 border-b border-slate-100 space-y-1.5">
          {lead.ownerName && <ContactRow icon="👤" value={lead.ownerName} />}
          {lead.phone     && <ContactRow icon="📞" value={lead.phone} />}
          {lead.email     && <ContactRow icon="✉️" value={lead.email} />}
          {lead.address   && <ContactRow icon="📍" value={lead.address} />}
          {lead.pincode   && <ContactRow icon="🏷️" value={lead.pincode} />}
          {!lead.ownerName && !lead.phone && !lead.email && (
            <p className="text-xs text-slate-300 italic">No contact details yet</p>
          )}
        </div>

        {/* Tags */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-400 mb-1.5">Tags {!canManageLeads && <span className="text-slate-300">(view only)</span>}</p>
          <div className="flex flex-wrap gap-1">
            {LEAD_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button key={tag} onClick={() => canManageLeads && toggleTag(tag)} disabled={!canManageLeads}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                    active ? `ring-1 ${TAG_COLORS[tag]}` : "bg-slate-50 text-slate-400 border border-slate-200 hover:border-slate-300"
                  } ${!canManageLeads ? "cursor-default" : "cursor-pointer"}`}>
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        {lead.notes && (
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Notes</p>
            <p className="text-xs text-slate-600 leading-relaxed">{lead.notes}</p>
          </div>
        )}

        {/* Assigned to */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-400 mb-1">Assigned to</p>
          {isAdmin ? (
            <select value={assignedToId} onChange={(e) => assignLead(e.target.value)}
              className="w-full text-xs text-slate-700 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500">
              <option value="">— Unassigned —</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          ) : (
            <p className="text-xs text-slate-700">{lead.assignedTo?.name ?? "Unassigned"}</p>
          )}
        </div>

        {/* Score breakdown */}
        {leadScore?.reasoning && (
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-400">Lead Score</p>
              <span className="text-xs font-mono font-semibold text-slate-600">{leadScore.score}/100</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{leadScore.reasoning}</p>
            <div className="flex gap-3 text-xs text-slate-400">
              <span>Fit <b className="text-slate-600">{leadScore.fitScore}</b></span>
              <span>Engage <b className="text-slate-600">{leadScore.engageScore}</b></span>
              <span>Intent <b className="text-slate-600">{leadScore.intentScore}</b></span>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="mt-auto px-4 py-3 flex flex-col gap-1.5 border-t border-slate-100">
          {canUseAIPitch && (
            <button onClick={refreshScore} className="text-xs text-slate-400 hover:text-slate-600 text-left">Refresh score</button>
          )}
          {canDeleteLeads && (
            <button onClick={deleteLead} className="text-xs text-red-400 hover:text-red-600 text-left">Delete lead</button>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL — Workflow tabs ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-50">

        {/* Tab bar */}
        <div className="bg-white border-b border-slate-200 flex overflow-x-auto shrink-0">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1 px-2.5 md:px-4 py-3 text-[11px] md:text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key ? "border-green-500 text-green-700 bg-green-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}>
              <span>{tab.icon}</span>
              {tab.label}
              {tab.key === "tasks"      && tasks.length > 0      && <Badge color="amber"   count={tasks.length} />}
              {tab.key === "activity"   && activities.length > 0  && <Badge color="slate"   count={activities.length} />}
              {tab.key === "sequences"  && enrollments.filter(e => e.status === "ACTIVE").length > 0 && <Badge color="emerald" count={enrollments.filter(e => e.status === "ACTIVE").length} />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── INTELLIGENCE TAB ─────────────────────────────────────────────── */}
          {activeTab === "intelligence" && (
            <div className="max-w-2xl space-y-4">
              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {canResearch && (
                  <button onClick={runResearch} disabled={researching}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                    {researching
                      ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Researching…</>
                      : <>{research ? "Re-run Research" : "Run Deep Research"}</>}
                  </button>
                )}
                {canUseAIPitch && !pitch && (
                  <button onClick={() => { setActiveTab("pitch"); generatePitch(); }}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                    Generate Pitch
                  </button>
                )}
                {canUseAIPitch && pitch && (
                  <button onClick={() => setActiveTab("pitch")}
                    className="flex items-center gap-2 border border-violet-300 text-violet-700 hover:bg-violet-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                    View Pitch
                  </button>
                )}
              </div>

              {researchError && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">{researchError}</div>
              )}

              {/* No research yet — enticing state */}
              {!research && !researching && !researchError && (
                <div className="bg-white rounded-xl border border-dashed border-indigo-200 p-8 text-center">
                  <p className="text-2xl mb-3">🔍</p>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Deep Research not run yet</p>
                  <p className="text-xs text-slate-400 mb-5 max-w-xs mx-auto">
                    Run research to get a full intelligence briefing on {lead.businessName} before your first outreach.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-left max-w-sm mx-auto mb-5">
                    {[
                      ["🏢", "Business profile & customer base"],
                      ["📱", "Social media & online presence"],
                      ["🍽️", "Menu insights & what fits"],
                      ["📦", "Products to recommend or cross-sell"],
                      ["🧑‍🍳", "Recipe ideas to pitch"],
                      ["💡", "How to open the conversation"],
                    ].map(([icon, label]) => (
                      <div key={label} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-slate-600">
                        <span>{icon}</span>{label}
                      </div>
                    ))}
                  </div>
                  {canResearch ? (
                    <button onClick={runResearch}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
                      Run Deep Research
                    </button>
                  ) : (
                    <p className="text-xs text-slate-400">Ask your admin to enable Deep Research for your account.</p>
                  )}
                </div>
              )}

              {/* Research results */}
              {research && (
                <div className="space-y-4">
                  {research.summary && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4">
                      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Summary</p>
                      <p className="text-sm text-indigo-900 leading-relaxed">{research.summary}</p>
                    </div>
                  )}
                  {research.engagementStrategy && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4">
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">💡 How to Open the Conversation</p>
                      <p className="text-sm text-amber-900 leading-relaxed">{research.engagementStrategy}</p>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <ResearchSection icon="🏢" title="Business Profile"        content={research.businessProfile} />
                    <ResearchSection icon="📱" title="Social Media"            content={research.socialMedia} />
                    <ResearchSection icon="🍽️" title="Menu Insights"           content={research.menuInsights} />
                    <ResearchSection icon="🌤️" title="Seasonal Opportunities"  content={research.seasonalOpportunities} />
                    <ResearchSection icon="📦" title="Recommended Products"    content={research.recommendedProducts} />
                    <ResearchSection icon="🔁" title="Cross-sell / Upsell Path" content={research.crossSellUpsell} />
                    <ResearchSection icon="🧑‍🍳" title="Recipe Ideas"           content={research.recipeIdeas} />
                    <ResearchSection icon="🏙️" title="Area Insights"           content={research.areaInsights} />
                  </div>
                  {research.quickLinks?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1.5">Quick Links</p>
                      <div className="flex flex-wrap gap-2">
                        {research.quickLinks.map((link, i) => {
                          const [label, url] = link.includes(": ") ? link.split(": ") : [link, link];
                          return (
                            <a key={i} href={url?.trim()} target="_blank" rel="noopener noreferrer"
                              className="text-xs bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full transition-colors">
                              {label?.trim()} ↗
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {canUseAIPitch && (
                    <button onClick={() => { setActiveTab("pitch"); if (!pitch) generatePitch(); }}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                      {pitch ? "View Pitch" : "Generate Pitch from Research"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── PITCH TAB ────────────────────────────────────────────────────── */}
          {activeTab === "pitch" && (
            <div className="max-w-2xl space-y-4">
              {!pitch && !generatingPitch && (
                <div className="bg-white rounded-xl border border-dashed border-violet-200 p-8 text-center">
                  <p className="text-2xl mb-3">✉️</p>
                  <p className="text-sm font-semibold text-slate-700 mb-1">No pitch generated yet</p>
                  <p className="text-xs text-slate-400 mb-5 max-w-xs mx-auto">
                    Generate a personalised email and WhatsApp pitch with product recommendations tailored to {lead.businessName}.
                  </p>
                  {canUseAIPitch ? (
                    <button onClick={generatePitch}
                      className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
                      Generate Pitch
                    </button>
                  ) : (
                    <p className="text-xs text-slate-400">Ask your admin to enable AI Pitch for your account.</p>
                  )}
                </div>
              )}

              {generatingPitch && (
                <div className="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Analysing {lead.businessName} and building your pitch…</p>
                </div>
              )}

              {pitch && !generatingPitch && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex border-b border-slate-100 bg-slate-50">
                    {(["email", "whatsapp", "products"] as const).map((tab) => (
                      <button key={tab} onClick={() => setPitchTab(tab)}
                        className={`px-5 py-3 text-xs font-medium capitalize border-b-2 transition-colors -mb-px ${
                          pitchTab === tab ? "border-violet-500 text-violet-700 bg-white" : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}>
                        {tab === "email" ? "📧 Email" : tab === "whatsapp" ? "💬 WhatsApp" : "📦 Products"}
                      </button>
                    ))}
                    <div className="ml-auto px-4 flex items-center">
                      <button onClick={generatePitch} disabled={generatingPitch} className="text-xs text-slate-400 hover:text-slate-600">Regenerate</button>
                    </div>
                  </div>

                  <div className="p-5">
                    {pitchTab === "email" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium">{pitch.subject}</div>
                          <button onClick={() => navigator.clipboard.writeText(pitch.subject)} className="text-xs text-slate-400 hover:text-slate-600 shrink-0">Copy</button>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-slate-400">Email Body</p>
                            <div className="flex gap-3">
                              {canSendEmail && (
                                <button onClick={() => { setEmailSubject(pitch.subject); setEmailBody(pitch.pitch); setActiveTab("email"); setEmailOpen(true); }}
                                  className="text-xs text-violet-600 hover:text-violet-800 font-medium">
                                  Send this →
                                </button>
                              )}
                              <button onClick={() => navigator.clipboard.writeText(pitch.pitch)} className="text-xs text-slate-400 hover:text-slate-600">Copy</button>
                            </div>
                          </div>
                          <pre className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg px-4 py-3 border border-slate-100 max-h-72 overflow-y-auto font-sans leading-relaxed">{pitch.pitch}</pre>
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
                            <button onClick={() => { setWaMessage(pitch.whatsappMessage); setActiveTab("whatsapp"); }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                              Send via WhatsApp →
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
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── WHATSAPP TAB ─────────────────────────────────────────────────── */}
          {activeTab === "whatsapp" && (
            <div className="max-w-lg flex flex-col h-full" style={{ maxHeight: "calc(100vh - 200px)" }}>
              {!canUseWhatsApp ? (
                <LockedFeature title="WhatsApp Messaging" message="Ask your admin to enable WhatsApp access." />
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ height: "100%", maxHeight: "600px" }}>
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-green-50 shrink-0">
                    <span className="text-green-600">💬</span>
                    <p className="text-sm font-medium text-green-800">WhatsApp</p>
                    {lead.phone && <span className="text-xs text-green-600 ml-auto">{lead.phone}</span>}
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-3 bg-[#f0f7f0] space-y-2 min-h-0">
                    {waConversation.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No messages yet</p>
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
                  <div className="px-4 py-3 border-t border-slate-100 shrink-0">
                    {!lead.phone ? (
                      <p className="text-xs text-slate-400 text-center">Add a phone number to enable WhatsApp</p>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input value={waMessage} onChange={(e) => setWaMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendWhatsApp()}
                            placeholder="Type a message…"
                            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                          <button onClick={sendWhatsApp} disabled={sendingWa || !waMessage.trim()}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-full">
                            {sendingWa ? "…" : "Send"}
                          </button>
                        </div>
                        {waError && <p className="text-xs text-red-500 mt-1.5 px-1">{waError}</p>}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EMAIL TAB ────────────────────────────────────────────────────── */}
          {activeTab === "email" && (
            <div className="max-w-2xl space-y-4">
              {!canSendEmail ? (
                <LockedFeature title="Send Email" message="Ask your admin to enable Email for your account." />
              ) : (
                <>
                  {emailHistory.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                        <p className="text-xs font-semibold text-slate-600">Email History</p>
                      </div>
                      <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                        {emailHistory.map((a) => {
                          const lines = a.note?.split("\n") ?? [];
                          const subject = lines[0]?.replace(/^\[/, "").replace(/\]$/, "") ?? "";
                          const preview = lines.slice(1).join(" ").slice(0, 100);
                          return (
                            <div key={a.id} className="px-4 py-3">
                              <p className="text-xs font-medium text-slate-700">{subject}</p>
                              <p className="text-xs text-slate-400 mt-0.5 truncate">{preview}</p>
                              <p className="text-[10px] text-slate-300 mt-1">
                                {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">Compose Email</p>
                      {!lead.email && <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">No email address on this lead</p>}
                    </div>
                    <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject…"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={8} placeholder="Write your email…"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                    <button onClick={sendEmail} disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim() || !lead.email}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                      {sendingEmail ? "Sending…" : `Send to ${lead.email ?? "—"}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── SEQUENCES TAB ────────────────────────────────────────────────── */}
          {activeTab === "sequences" && (
            <div className="max-w-xl space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                <p className="text-sm font-semibold text-slate-700">Enroll in a Sequence</p>
                <div className="flex gap-2">
                  <select value={selectedSeqId} onChange={(e) => setSelectedSeqId(e.target.value)}
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">— Select a sequence —</option>
                    {sequences.map((s) => <option key={s.id} value={s.id}>{s.name} · {(s.steps as unknown[]).length} steps</option>)}
                  </select>
                  <button onClick={enrollInSequence} disabled={!selectedSeqId || enrolling}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 rounded-lg">
                    {enrolling ? "…" : "Enroll"}
                  </button>
                </div>
                {sequences.length === 0 && <p className="text-xs text-slate-400">No active sequences — create one in WA Sequences first.</p>}
              </div>

              {enrollments.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm text-slate-400">Not enrolled in any sequence yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((e) => {
                    const totalSteps = (e.sequence.steps as unknown[]).length;
                    const pct = totalSteps > 0 ? Math.round((e.currentStep / totalSteps) * 100) : 0;
                    const sc = e.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : e.status === "COMPLETED" ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700";
                    return (
                      <div key={e.id} className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{e.sequence.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Step {e.currentStep + 1} of {totalSteps}
                              {e.nextSendAt && e.status === "ACTIVE" && <> · Next: {new Date(e.nextSendAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</>}
                            </p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc}`}>{e.status}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        {e.status !== "COMPLETED" && (
                          <div className="flex gap-3">
                            {e.status === "ACTIVE"
                              ? <button onClick={() => updateEnrollmentStatus(e.id, "PAUSED")} className="text-xs text-amber-600 hover:text-amber-800 font-medium">Pause</button>
                              : e.status === "PAUSED"
                              ? <button onClick={() => updateEnrollmentStatus(e.id, "ACTIVE")} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">Resume</button>
                              : null}
                            <button onClick={() => updateEnrollmentStatus(e.id, "UNSUBSCRIBED")} className="text-xs text-red-400 hover:text-red-600 font-medium ml-auto">Unsubscribe</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TASKS TAB ────────────────────────────────────────────────────── */}
          {activeTab === "tasks" && (
            <div className="max-w-xl space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Open Tasks</p>
                <button onClick={() => setShowTaskForm((v) => !v)} className="text-xs text-green-600 hover:text-green-700 font-medium">+ Add task</button>
              </div>

              {showTaskForm && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
                  <input autoFocus value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title…"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <div className="flex gap-2">
                    <select value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}
                      className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                      {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((k) => <option key={k} value={k}>{TASK_TYPE_ICONS[k]} {TASK_TYPE_LABELS[k]}</option>)}
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
                <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm text-slate-400">No open tasks</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
                  {tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <button onClick={() => completeTask(t.id)} className="w-4 h-4 rounded-full border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 shrink-0" />
                      <span className="text-base shrink-0">{TASK_TYPE_ICONS[t.type]}</span>
                      <span className="flex-1 text-sm text-slate-800">{t.title}</span>
                      {t.dueDate && <span className="text-xs text-slate-400 shrink-0">{new Date(t.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY TAB ─────────────────────────────────────────────────── */}
          {activeTab === "activity" && (
            <div className="max-w-xl space-y-4">
              <div className="flex gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addActivity()}
                  placeholder="Add a note…"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <button onClick={addActivity} disabled={addingNote || !note.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 rounded-lg">Add</button>
              </div>

              {activities.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm text-slate-400">No activity yet</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
                  {activities.map((a) => (
                    <div key={a.id} className="flex gap-3 px-4 py-3 items-start">
                      <span className="text-base shrink-0 mt-0.5">{ACTIVITY_ICONS[a.type] ?? "📌"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">{a.note}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {a.type.replace(/_/g, " ").toLowerCase()} ·{" "}
                          {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>{/* end tab content */}
      </div>{/* end right panel */}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function ContactRow({ icon, value }: { icon: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs shrink-0 mt-0.5">{icon}</span>
      <span className="text-xs text-slate-700 break-all leading-relaxed">{value}</span>
    </div>
  );
}

function Badge({ color, count }: { color: "amber" | "slate" | "emerald"; count: number }) {
  const cls = color === "amber" ? "bg-amber-100 text-amber-600" : color === "emerald" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500";
  return <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${cls}`}>{count}</span>;
}

function LockedFeature({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-6 flex items-center gap-3">
      <span className="text-2xl">🔒</span>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-400">{message}</p>
      </div>
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
