import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { ImportCsvClient } from "./ImportCsvClient";

export default function ImportCsvPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Import Leads" subtitle="Upload a CSV or Excel file to bulk-add leads">
        <Link href="/dashboard/leads" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Leads
        </Link>
      </Header>
      <div className="flex-1 overflow-y-auto p-6">
        <ImportCsvClient />
      </div>
    </div>
  );
}
