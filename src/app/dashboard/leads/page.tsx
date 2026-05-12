export const dynamic = "force-dynamic";

import { getSession as auth } from "@/lib/session";
import { Header } from "@/components/layout/Header";
import { db } from "@/lib/db";
import Link from "next/link";
import { Suspense } from "react";
import { LeadsFilterBar, TAG_COLORS } from "./LeadsFilterBar";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-yellow-50 text-yellow-700",
  QUALIFIED: "bg-purple-50 text-purple-700",
  PROPOSAL_SENT: "bg-orange-50 text-orange-700",
  NEGOTIATION: "bg-pink-50 text-pink-700",
  WON: "bg-green-50 text-green-700",
  LOST: "bg-red-50 text-red-700",
};

type SortKey = "city-grouped" | "newest" | "name";

function buildOrderBy(sort: SortKey) {
  if (sort === "city-grouped") return [{ city: "asc" as const }, { createdAt: "desc" as const }];
  if (sort === "name")         return [{ businessName: "asc" as const }];
  return [{ createdAt: "desc" as const }];
}

// Group a flat list by city, preserving inner order (newest first within each city)
function groupByCity<T extends { city?: string | null }>(leads: T[]): { city: string; leads: T[] }[] {
  const map = new Map<string, T[]>();
  for (const lead of leads) {
    const key = lead.city?.trim() || "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(lead);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    })
    .map(([city, leads]) => ({ city, leads }));
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string }>;
}) {
  const session   = await auth();
  const isAdmin   = ["SUPER_ADMIN", "ADMIN"].includes(session?.role ?? "");
  const sp        = await searchParams;
  const sort      = (sp.sort ?? "city-grouped") as SortKey;
  const tagFilter = sp.tag ?? "";

  const where = {
    ...(isAdmin ? {} : { assignedToId: session?.id }),
    ...(tagFilter ? { tags: { has: tagFilter } } : {}),
  };

  const leads = await db.lead.findMany({
    where,
    include: { assignedTo: { select: { name: true } } },
    orderBy: buildOrderBy(sort),
    take: 200,
  });

  // Unique tags across all unfiltered leads for the filter bar
  const allLeadTags = tagFilter
    ? await db.lead.findMany({
        where: isAdmin ? {} : { assignedToId: session?.id },
        select: { tags: true },
      })
    : leads;
  const allTags = Array.from(new Set(allLeadTags.flatMap((l) => l.tags))).sort();

  const grouped = sort === "city-grouped" ? groupByCity(leads) : null;

  return (
    <div>
      <Header
        title="Leads"
        subtitle={`${leads.length} ${tagFilter ? `"${tagFilter}" ` : ""}${isAdmin ? "total" : "assigned"} leads`}
      >
        <Link
          href="/dashboard/leads/import-csv"
          className="hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Import CSV
        </Link>
        {isAdmin && (
          <Link
            href="/dashboard/leads/import"
            className="hidden md:inline-flex text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Import Maps
          </Link>
        )}
        <Link
          href="/dashboard/leads/new"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Lead
        </Link>
      </Header>

      <div className="p-4 md:p-6">
        <Suspense fallback={null}>
          <LeadsFilterBar allTags={allTags} />
        </Suspense>

        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-3xl mb-3">👥</p>
            <p className="text-slate-600 font-medium">No leads found</p>
            <p className="text-slate-400 text-sm mt-1">
              {tagFilter
                ? `No leads tagged "${tagFilter}".`
                : isAdmin
                ? "Add your first lead to get started."
                : "No leads assigned to you yet."}
            </p>
            {tagFilter ? (
              <Link href="/dashboard/leads" className="mt-3 text-sm text-green-600 hover:text-green-700">
                Clear filter
              </Link>
            ) : isAdmin ? (
              <Link
                href="/dashboard/leads/new"
                className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                + Add Lead
              </Link>
            ) : null}
          </div>
        ) : grouped ? (
          /* ── City-grouped view ──────────────────────────────────────── */
          <div className="space-y-6">
            {grouped.map(({ city, leads: cityLeads }) => (
              <div key={city}>
                {/* City header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{city}</span>
                  <span className="text-xs text-slate-300 font-medium">{cityLeads.length}</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {cityLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} isAdmin={isAdmin} />
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      {cityLeads.map((lead) => (
                        <LeadRow key={lead.id} lead={lead} isAdmin={isAdmin} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Flat view (newest / name sort) ─────────────────────────── */
          <>
            <div className="md:hidden space-y-2">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} isAdmin={isAdmin} />
              ))}
            </div>
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Business</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Owner</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">City</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Tags</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                    {isAdmin && <th className="text-left px-4 py-3 font-medium text-slate-500">Assigned</th>}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <LeadRow key={lead.id} lead={lead} isAdmin={isAdmin} showCity />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Shared sub-components ────────────────────────────────────────────────── */

type Lead = {
  id: string;
  businessName: string;
  ownerName?: string | null;
  phone?: string | null;
  city?: string | null;
  status: string;
  tags: string[];
  createdAt: Date;
  assignedTo?: { name: string } | null;
};

function LeadCard({ lead, isAdmin }: { lead: Lead; isAdmin: boolean }) {
  return (
    <Link
      href={`/dashboard/leads/${lead.id}`}
      className="block bg-white rounded-xl border border-slate-200 px-4 py-3 active:bg-slate-50"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{lead.businessName}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {lead.ownerName && <span className="text-xs text-slate-500">{lead.ownerName}</span>}
            {lead.phone     && <span className="text-xs text-slate-400">· {lead.phone}</span>}
          </div>
          {lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {lead.tags.map((tag) => (
                <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ring-1 ${TAG_COLORS[tag] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
            {lead.status.replace("_", " ")}
          </span>
          {isAdmin && lead.assignedTo && (
            <span className="text-[10px] text-slate-400">{lead.assignedTo.name}</span>
          )}
          <span className="text-[10px] text-slate-300">
            {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>
    </Link>
  );
}

function LeadRow({ lead, isAdmin, showCity = false }: { lead: Lead; isAdmin: boolean; showCity?: boolean }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 font-medium text-slate-900">
        <div>
          {lead.businessName}
          <p className="text-[11px] text-slate-400 font-normal mt-0.5">
            {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600">{lead.ownerName ?? "—"}</td>
      {showCity && <td className="px-4 py-3 text-slate-600">{lead.city ?? "—"}</td>}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {lead.tags.length > 0
            ? lead.tags.map((tag) => (
                <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ring-1 ${TAG_COLORS[tag] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                  {tag}
                </span>
              ))
            : <span className="text-slate-300 text-xs">—</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
          {lead.status.replace("_", " ")}
        </span>
      </td>
      {isAdmin && (
        <td className="px-4 py-3 text-slate-600">{lead.assignedTo?.name ?? "—"}</td>
      )}
      <td className="px-4 py-3">
        <Link href={`/dashboard/leads/${lead.id}`} className="text-green-600 hover:text-green-700 font-medium">
          View →
        </Link>
      </td>
    </tr>
  );
}
