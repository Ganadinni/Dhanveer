"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import Link from "next/link";
import { useState } from "react";

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL_SENT" | "NEGOTIATION" | "WON" | "LOST";

interface Lead {
  id: string;
  businessName: string;
  ownerName: string | null;
  city: string | null;
  phone: string | null;
  status: LeadStatus;
  assignedTo: { name: string } | null;
  updatedAt: string;
}

const COLUMNS: { status: LeadStatus; label: string; color: string; dot: string }[] = [
  { status: "NEW", label: "New", color: "bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  { status: "CONTACTED", label: "Contacted", color: "bg-yellow-50 border-yellow-200", dot: "bg-yellow-500" },
  { status: "QUALIFIED", label: "Qualified", color: "bg-purple-50 border-purple-200", dot: "bg-purple-500" },
  { status: "PROPOSAL_SENT", label: "Proposal Sent", color: "bg-orange-50 border-orange-200", dot: "bg-orange-500" },
  { status: "NEGOTIATION", label: "Negotiation", color: "bg-pink-50 border-pink-200", dot: "bg-pink-500" },
  { status: "WON", label: "Won", color: "bg-green-50 border-green-200", dot: "bg-green-500" },
  { status: "LOST", label: "Lost", color: "bg-red-50 border-red-200", dot: "bg-red-400" },
];

function LeadCard({ lead, dragging = false }: { lead: Lead; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  if (dragging) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-lg p-3 w-56 opacity-90">
        <p className="text-sm font-medium text-slate-900 truncate">{lead.businessName}</p>
        {lead.city && <p className="text-xs text-slate-400 mt-0.5">{lead.city}</p>}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow touch-none"
    >
      <Link
        href={`/dashboard/leads/${lead.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block"
      >
        <p className="text-sm font-medium text-slate-900 truncate hover:text-green-700">{lead.businessName}</p>
        {lead.ownerName && <p className="text-xs text-slate-500 mt-0.5 truncate">{lead.ownerName}</p>}
        <div className="flex items-center justify-between mt-2">
          {lead.city && <p className="text-xs text-slate-400">{lead.city}</p>}
          {lead.assignedTo && (
            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
              {lead.assignedTo.name}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

function Column({ status, label, color, dot, leads }: {
  status: LeadStatus;
  label: string;
  color: string;
  dot: string;
  leads: Lead[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-56 shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="ml-auto text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-xl border p-2 space-y-2 transition-colors ${color} ${isOver ? "ring-2 ring-green-400 ring-offset-1" : ""}`}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-slate-400">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export function PipelineClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeLead = leads.find((l) => l.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const newStatus = over.id as LeadStatus;
    const lead = leads.find((l) => l.id === active.id);
    if (!lead || lead.status === newStatus) return;

    setLeads((prev) => prev.map((l) => l.id === active.id ? { ...l, status: newStatus } : l));

    await fetch(`/api/leads/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  const byStatus = (status: LeadStatus) => leads.filter((l) => l.status === status);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 pb-4 overflow-x-auto min-h-full">
        {COLUMNS.map((col) => (
          <Column
            key={col.status}
            {...col}
            leads={byStatus(col.status)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} dragging />}
      </DragOverlay>
    </DndContext>
  );
}
