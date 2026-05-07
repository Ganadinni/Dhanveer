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
  assignedTo?: { name: string } | null;
  activities: { id: string; type: string; note?: string | null; createdAt: string }[];
  tasks: Task[];
}

export function LeadDetailClient({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [activities, setActivities] = useState(lead.activities);
  const [tasks, setTasks] = useState<Task[]>(lead.tasks ?? []);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("FOLLOW_UP");
  const [taskDue, setTaskDue] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

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
      setActivities([json.data, ...activities]);
      setNote("");
    }
    setAddingNote(false);
  }

  async function deleteLead() {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    router.push("/dashboard/leads");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Info card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{lead.businessName}</h2>
            <p className="text-sm text-slate-500">{lead.source.replace("_", " ")}</p>
          </div>
          <button onClick={deleteLead} className="text-xs text-red-500 hover:text-red-700">
            Delete lead
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <Info label="Owner" value={lead.ownerName} />
          <Info label="Phone" value={lead.phone} />
          <Info label="Email" value={lead.email} />
          <Info label="City" value={[lead.city, lead.state, lead.pincode].filter(Boolean).join(", ")} />
          <Info label="Address" value={lead.address} />
          <Info label="Assigned to" value={lead.assignedTo?.name} />
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
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="text-slate-400 whitespace-nowrap text-xs pt-0.5">
                  {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <span className="text-slate-700">{a.note}</span>
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
