"use client";

import Link from "next/link";
import { useState } from "react";

type TaskType = "CALL" | "FOLLOW_UP" | "MEETING" | "EMAIL" | "OTHER";

interface Task {
  id: string;
  title: string;
  type: TaskType;
  dueDate: string | null;
  completed: boolean;
  notes: string | null;
  lead: { id: string; businessName: string } | null;
  assignedTo: { id: string; name: string } | null;
}

const TYPE_ICONS: Record<TaskType, string> = {
  CALL: "📞",
  FOLLOW_UP: "🔔",
  MEETING: "🤝",
  EMAIL: "✉️",
  OTHER: "📌",
};

const TYPE_LABELS: Record<TaskType, string> = {
  CALL: "Call",
  FOLLOW_UP: "Follow-up",
  MEETING: "Meeting",
  EMAIL: "Email",
  OTHER: "Other",
};

function formatDue(dateStr: string | null): { label: string; urgent: boolean } {
  if (!dateStr) return { label: "No due date", urgent: false };
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, urgent: true };
  if (diff === 0) return { label: "Today", urgent: true };
  if (diff === 1) return { label: "Tomorrow", urgent: false };
  return {
    label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    urgent: false,
  };
}

function TaskCard({ task, onComplete, onDelete }: {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const due = formatDue(task.dueDate);

  return (
    <div className="flex items-start gap-3 py-3 px-4 hover:bg-slate-50 rounded-lg group">
      <button
        onClick={() => onComplete(task.id)}
        className="mt-0.5 w-5 h-5 rounded-full border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 transition-colors shrink-0"
        title="Mark complete"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{TYPE_ICONS[task.type]}</span>
          <p className="text-sm font-medium text-slate-900">{task.title}</p>
          <span className="text-xs text-slate-400">{TYPE_LABELS[task.type]}</span>
        </div>
        {task.lead && (
          <Link href={`/dashboard/leads/${task.lead.id}`} className="text-xs text-green-600 hover:underline mt-0.5 block">
            {task.lead.businessName}
          </Link>
        )}
        {task.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{task.notes}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${due.urgent ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>
          {due.label}
        </span>
        <button
          onClick={() => onDelete(task.id)}
          className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function AddTaskForm({ onAdd }: { onAdd: (task: Task) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("FOLLOW_UP");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type, dueDate: dueDate || null, notes: notes || null }),
    });
    const data = await res.json();
    if (res.ok) {
      onAdd(data.task);
      setTitle(""); setType("FOLLOW_UP"); setDueDate(""); setNotes("");
      setOpen(false);
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-green-600 px-4 py-2 hover:bg-green-50 rounded-lg transition-colors w-full"
      >
        <span>+</span> Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 bg-slate-50 rounded-lg space-y-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…"
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TaskType)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{TYPE_ICONS[k as TaskType]} {v}</option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
        >
          {saving ? "Saving…" : "Add Task"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-600 px-3 py-1.5">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < todayStart);
  const today = tasks.filter((t) => t.dueDate && new Date(t.dueDate) >= todayStart && new Date(t.dueDate) <= todayEnd);
  const upcoming = tasks.filter((t) => !t.dueDate || new Date(t.dueDate) > todayEnd);

  async function handleComplete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  function handleAdd(task: Task) {
    setTasks((prev) => [task, ...prev]);
  }

  function Section({ title, items, accent }: { title: string; items: Task[]; accent: string }) {
    if (items.length === 0) return null;
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={`px-4 py-2.5 border-b border-slate-100 ${accent}`}>
          <span className="text-sm font-semibold">{title}</span>
          <span className="ml-2 text-xs text-slate-400">{items.length}</span>
        </div>
        <div className="divide-y divide-slate-50">
          {items.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Section title="Overdue" items={overdue} accent="text-red-700 bg-red-50" />
      <Section title="Today" items={today} accent="text-slate-800 bg-slate-50" />
      <Section title="Upcoming" items={upcoming} accent="text-slate-600 bg-white" />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 bg-white">
          <span className="text-sm font-semibold text-slate-700">Add New Task</span>
        </div>
        <div className="p-2">
          <AddTaskForm onAdd={handleAdd} />
        </div>
      </div>

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm font-medium">All clear — no pending tasks</p>
        </div>
      )}
    </div>
  );
}
