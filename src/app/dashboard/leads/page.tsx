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

type SortKey = "newest" | "city" | "name";

function buildOrderBy(sort: SortKey) {
  if (sort === "city")  return [{ city: "asc" as const }, { businessName: "asc" as const }];
  if (sort === "name")  return [{ businessName: "asc" as const }];
  return [{ createdAt: "desc" as const }];
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string }>;
}) {
  const session  = await auth();
  const isAdmin  = session?.role === "ADMIN";
  const sp       = await searchParams;
  const sort     = (sp.sort ?? "newest") as SortKey;
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

  // Collect all unique tags across ALL leads (not just filtered) for the filter bar
  const allLeads = tagFilter
    ? await db.lead.findMany({
        where: isAdmin ? {} : { assignedToId: session?.id },
        select: { tags: true },
      })
    : leads;
  const allTags = Array.from(
    new Set(allLeads.flatMap((l) => l.tags))
  ).sort();

  return (
    <div>
      <Header title="Leads" subtitle={`${leads.length} ${tagFilter ? `"${tagFilter}" ` : ""}${isAdmin ? "total" : "assigned"} leads`}>
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
        {/* Filter bar */}
        <Suspense fallback={null}>
          <LeadsFilterBar allTags={allTags} />
        </Suspense>

        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-3xl mb-3">👥</p>
            <p className="text-slate-600 font-medium">No leads found</p>
            <p className="text-slate-400 text-sm mt-1">
              {tagFilter ? `No leads tagged "${tagFilter}".` : isAdmin ? "Add your first lead to get started." : "No leads assigned to you yet."}
            </p>
            {tagFilter ? (
              <Link href="/dashboard/leads" className="mt-3 text-sm text-green-600 hover:text-green-700">
                Clear filter
              </Link>
            ) : isAdmin ? (
              <Link href="/dashboard/leads/new" className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                + Add Lead
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            {/* ── Mobile card list ──────────────────────────────────────── */}
            <div className="md:hidden space-y-2">
              {leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="block bg-white rounded-xl border border-slate-200 px-4 py-3 active:bg-slate-50"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{lead.businessName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {lead.ownerName && (
                          <span className="text-xs text-slate-500">{lead.ownerName}</span>
                        )}
                        {lead.city && (
                          <span className="text-xs text-slate-400">· {lead.city}</span>
                        )}
                      </div>
                      {lead.phone && (
                        <p className="text-xs text-slate-400 mt-0.5">{lead.phone}</p>
                      )}
                      {/* Tags */}
                      {lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {lead.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ring-1 ${TAG_COLORS[tag] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}
                            >
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
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* ── Desktop table ─────────────────────────────────────────── */}
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
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{lead.businessName}</td>
                      <td className="px-4 py-3 text-slate-600">{lead.ownerName ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{lead.city ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.length > 0 ? lead.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ring-1 ${TAG_COLORS[tag] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}
                            >
                              {tag}
                            </span>
                          )) : <span className="text-slate-300 text-xs">—</span>}
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
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
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
