import { Header } from "@/components/layout/Header";
import { KnowledgeClient } from "./KnowledgeClient";

export default function KnowledgePage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Product Knowledge Base"
        subtitle="Teach Dhanveer about The Tea Planet's products, pricing, HSN codes and target customers"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <KnowledgeClient />
      </div>
    </div>
  );
}
