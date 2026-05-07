import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { DiscoverClient } from "./DiscoverClient";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Lead Discovery"
        subtitle="Automatically find F&B businesses via Google Maps and import as leads"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <DiscoverClient />
      </div>
    </div>
  );
}
