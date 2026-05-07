import { Header } from "@/components/layout/Header";
import { SocialClient } from "./SocialClient";

export const dynamic = "force-dynamic";

export default function SocialPage() {
  const hasSerper = !!process.env.SERPER_API_KEY;
  const hasAI     = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Social Media Monitor"
        subtitle="Find F&B leads from Instagram, LinkedIn, YouTube and Facebook using keyword search"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <SocialClient hasSerper={hasSerper} hasAI={hasAI} />
      </div>
    </div>
  );
}
