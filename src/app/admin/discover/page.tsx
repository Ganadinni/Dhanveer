import { Header } from "@/components/layout/Header";
import { DiscoverClient } from "./DiscoverClient";

export const dynamic = "force-dynamic";

export default function DiscoverPage() {
  const isConfigured = !!process.env.GOOGLE_PLACES_API_KEY;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Lead Discovery"
        subtitle="Automatically find F&B businesses via Google Maps and import as leads"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <DiscoverClient isConfigured={isConfigured} />
      </div>
    </div>
  );
}
