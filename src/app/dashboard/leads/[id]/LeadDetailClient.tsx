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

interface Task {
  id: string;
  title: string;
  type: TaskType;
  dueDate: string | null;
  completed: boolean;
  notes: string | null;
}

type Activity = { id: string; type: string; note?: string | null; createdAt: string };

const STATUS_OPTIONS = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-yellow-50 text-yellow-700",
  QUALIFIED: "bg-purple-50 text-purple-700",
  PROPOSAL_SENT: "bg-orange-50 text-orange-700",
  NEGOTIATION: "bg-pink-50 text-pink-700",
  WON: "bg-green-50 text-green-700",
  LOST: "bg-red-50 text-red-700",
};

const ACTIVITY_ICONS: Record<string, string> = {
  NOTE: "📝",
  CALL: "📞",
  WHATSAPP_SENT: "💬",
  WHATSAPP_RECEIVED: "💬",
  EMAIL: "✉️",
  VISIT: "🏢",
};

interface Lead {
  id: string;
  businessName: string;
  ownerName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  status: string;
  source: string;
  notes?: string | null;
  assignedTo?: { id?: string; name: string } | null;
  assignedToId?: string | null;
  activities: Activity[];
  tasks: Task[];
}

interface UserOption { id: string; name: string; role: string; }

export function LeadDetailClient({ lead, isAdmin = false, users = [] }: {
  lead: Lead;
  isAdmin?: boolean;
  users?: UserOption[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [activities, setActivities] = useState<Activity[]>(lead.activities);
  const [tasks, setTasks] = useState<Task[]>(lead.tasks ?? []);
  const [assignedToId, setAssignedToId] = useState(lead.assignedToId ?? "");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("FOLLOW_UP");
  const [taskDue, setTaskDue] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // WhatsApp state
  const [waMessage, setWaMessage] = useState("");
  const [sendingWa, setSendingWa] = useState(false);
  const [waError, setWaError] = useState("");

  async function addTask() {
    if (!taskTitle.trim()) return;
    setAddingTask(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskTitle, type: taskType, dueDate: taskDue || null, leadId: lead.id }),
    });
    if (res.ok) {
      const json = await res.json();
      setTasks((prev) => [json.task, ...prev]);
      setTaskTitle(""); setTaskDue(""); setTaskType("FOLLOW_UP");
      setShowTaskForm(false);
    }
    setAddingTask(false);
  }

  async function completeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
  }

  async function updateStatus(newStatus: string) {
    setSaving(true);
    setStatus(newStatus);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    router.refresh();
  }

  async function addActivity() {
    if (!note.trim()) return;
    setAddingNote(true);
    const res = await fetch(`/api/leads/${lead.id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "NOTE", note }),
    });
    if (res.ok) {
      const json = await res.json();
      setActivities((prev) => [json.data, ...prev]);
      setNote("");
    }
    setAddingNote(false);
  }

  async function assignLead(newAssignedToId: string) {
    setAssignedToId(newAssignedToId);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: newAssignedToId || null }),
    });
  }

  async function sendWhatsApp() {
    if (!waMessage.trim() || !lead.phone) return;
    setSendingWa(true);
    setWaError("");
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, to: lead.phone, message: waMessage }),
    });
    const data = await res.json();
    if (res.ok) {
      const newActivity: Activity = {
        id: crypto.randomUUID(),
        type: "WHATSAPP_SENT",
        note: waMessage,
        createdAt: new Date().toISOString(),
      };
      setActivities((prev) => [newActivity, ...prev]);
      setWaMessage("");
    } else {
      setWaError(data.error ?? "Failed to send");
    }
    setSendingWa(false);
  }

  async function deleteLead() {
    if (!isAdmin) return;
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    router.push("/dashboard/leads");
  }

  const waConversation = activities.filter((a) =>
    a.type === "WHATSAPP_SENT" || a.type === "WHATSAPP_RECEIVED"
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Info card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{lead.businessName}</h2>
            {isAdmin && <p className="text-sm text-slate-400">Source: {lead.source.replace(/_/g, " ")}</p>}
          </div>
          {isAdmin && (
            <button onClick={deleteLead} className="text-xs text-red-500 hover:text-red-700">
              Delete lead
            </button>
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
              <select
                value={assignedToId}
                onChange={(e) => assignLead(e.target.value)}
                className="mt-1 text-sm text-slate-700 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              >
                <option value="">— Unassigned —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
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
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">
          Status {saving && <span className="text-slate-400 font-normal">(saving…)</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                status === s
                  ? `${STATUS_COLORS[s]} border-transparent ring-2 ring-offset-1 ring-green-400`
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-green-50">
          <span className="text-green-600 text-base">💬</span>
          <p className="text-sm font-medium text-green-800">WhatsApp</p>
          {lead.phone && <span className="text-xs text-green-600 ml-auto">{lead.phone}</span>}
        </div>

        {/* Conversation thread */}
        <div className="px-5 py-4 space-y-2 max-h-64 overflow-y-auto bg-[#f0f7f0]">
          {waConversation.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No WhatsApp messages yet</p>
          ) : (
            [...waConversation].reverse().map((a) => {
              const sent = a.type === "WHATSAPP_SENT";
              return (
                <div key={a.id} className={`flex ${sent ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                      sent
                        ? "bg-green-600 text-white rounded-br-sm"
                        : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
                    }`}
                  >
                    <p>{a.note}</p>
                    <p className={`text-[10px] mt-1 ${sent ? "text-green-100" : "text-slate-400"}`}>
                      {new Date(a.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                      {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Send box */}
        <div className="px-4 py-3 border-t border-slate-100">
          {!lead.phone ? (
            <p className="text-xs text-slate-400 text-center">Add a phone number to this lead to enable WhatsApp</p>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendWhatsApp()}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={sendWhatsApp}
                  disabled={sendingWa || !waMessage.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
                >
                  {sendingWa ? "…" : "Send"}
                </button>
              </div>
              {waError && <p className="text-xs text-red-500 mt-1.5 px-1">{waError}</p>}
            </>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-700">Tasks</p>
          <button onClick={() => setShowTaskForm((v) => !v)} className="text-xs text-green-600 hover:text-green-700 font-medium">
            + Add task
          </button>
        </div>

        {showTaskForm && (
          <div className="mb-4 space-y-2 p-3 bg-slate-50 rounded-lg">
            <input
              autoFocus
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title…"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-2">
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((k) => (
                  <option key={k} value={k}>{TASK_TYPE_ICONS[k]} {TASK_TYPE_LABELS[k]}</option>
                ))}
              </select>
              <input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addTask}
                disabled={addingTask || !taskTitle.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
              >
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
                <button
                  onClick={() => completeTask(t.id)}
                  className="w-4 h-4 rounded-full border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 shrink-0"
                />
                <span className="text-slate-500">{TASK_TYPE_ICONS[t.type]}</span>
                <span className="flex-1 text-slate-800">{t.title}</span>
                {t.dueDate && (
                  <span className="text-xs text-slate-400">
                    {new Date(t.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Activity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">Activity</p>
        <div className="flex gap-2 mb-4">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addActivity()}
            placeholder="Add a note…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={addActivity}
            disabled={addingNote || !note.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 rounded-lg"
          >
            Add
          </button>
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
