export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { PipelineClient } from "./PipelineClient";

export default async function PipelinePage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const leads = await db.lead.findMany({
    where: {
      status: { notIn: ["WON", "LOST"] },
      ...(isAdmin ? {} : { assignedToId: session?.user?.id }),
    },
    select: {
      id: true,
      businessName: true,
      ownerName: true,
      city: true,
      phone: true,
      status: true,
      updatedAt: true,
      assignedTo: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const wonWhere = isAdmin ? { status: "WON" as const } : { status: "WON" as const, assignedToId: session?.user?.id };
  const lostWhere = isAdmin ? { status: "LOST" as const } : { status: "LOST" as const, assignedToId: session?.user?.id };
  const won = await db.lead.count({ where: wonWhere });
  const lost = await db.lead.count({ where: lostWhere });

  return (
    <div className="flex flex-col h-full">
      <Header title="Pipeline" subtitle={`${leads.length} active leads · ${won} won · ${lost} lost`} />
      <div className="flex-1 overflow-auto p-6">
        <PipelineClient initialLeads={JSON.parse(JSON.stringify(leads))} />
      </div>
    </div>
  );
}
