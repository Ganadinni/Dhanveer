export const dynamic = "force-dynamic";

import { getSession as auth } from "@/lib/session";
import { Header } from "@/components/layout/Header";
import { db } from "@/lib/db";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-yellow-50 text-yellow-700",
  QUALIFIED: "bg-purple-50 text-purple-700",
  PROPOSAL_SENT: "bg-orange-50 text-orange-700",
  NEGOTIATION: "bg-pink-50 text-pink-700",
  WON: "bg-green-50 text-green-700",
  LOST: "bg-red-50 text-red-700",
};

export default async function LeadsPage() {
  const session = await auth();
  const isAdmin = session?.role === "ADMIN";

  const leads = await db.lead.findMany({
    where: isAdmin ? {} : { assignedToId: session?.id },
    include: { assignedTo: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Leads" subtitle={`${leads.length} ${isAdmin ? "total" : "assigned"} leads`}>
        {isAdmin && (
          <Link
            href="/dashboard/leads/import"
            className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Import from Google Maps
          </Link>
        )}
        <Link
          href="/dashboard/leads/new"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Lead
        </Link>
      </Header>

      <div className="flex-1 overflow-y-auto p-6">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-slate-600 font-medium">No leads yet</p>
            <p className="text-slate-400 text-sm mt-1">
              {isAdmin ? "Add your first lead to get started." : "No leads assigned to you yet."}
            </p>
            {isAdmin && (
              <Link
                href="/dashboard/leads/new"
                className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                + Add Lead
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Owner</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">City</th>
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
                    <td className="px-4 py-3 text-slate-600">{lead.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{lead.city ?? "—"}</td>
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
        )}
      </div>
    </div>
  );
}
