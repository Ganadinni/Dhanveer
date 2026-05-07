import { Header } from "@/components/layout/Header";
import { SequencesClient } from "./SequencesClient";

export const dynamic = "force-dynamic";

export default function SequencesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="WhatsApp Sequences"
        subtitle="Automated drip campaigns — set messages, set delays, enroll leads"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <SequencesClient />
      </div>
    </div>
  );
}
