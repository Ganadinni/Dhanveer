import { Header } from "@/components/layout/Header";
import { DiscoverClient } from "./DiscoverClient";

export const dynamic = "force-dynamic";

export default function DiscoverPage() {
  const isConfigured = !!process.env.GOOGLE_PLACES_API_KEY;
  const hasSerper    = !!process.env.SERPER_API_KEY;
  const hasAI        = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Lead Discovery"
        subtitle="Find new F&B leads from Google Maps and social media"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <DiscoverClient isConfigured={isConfigured} hasSerper={hasSerper} hasAI={hasAI} />
      </div>
    </div>
  );
}
