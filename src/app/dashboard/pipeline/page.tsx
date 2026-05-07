export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { PipelineClient } from "./PipelineClient";

export default async function PipelinePage() {
  const leads = await db.lead.findMany({
    where: { status: { notIn: ["WON", "LOST"] } },
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

  const won = await db.lead.count({ where: { status: "WON" } });
  const lost = await db.lead.count({ where: { status: "LOST" } });

  return (
    <div className="flex flex-col h-full">
      <Header title="Pipeline" subtitle={`${leads.length} active leads · ${won} won · ${lost} lost`} />
      <div className="flex-1 overflow-auto p-6">
        <PipelineClient initialLeads={JSON.parse(JSON.stringify(leads))} />
      </div>
    </div>
  );
}
