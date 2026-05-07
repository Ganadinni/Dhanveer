import { Header } from "@/components/layout/Header";
import { db } from "@/lib/db";
import { RasikSettingsClient } from "./RasikSettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rasikConfig = await db.rasikConfig.findFirst();

  return (
    <div className="flex flex-col h-full">
      <Header title="Integrations & Settings" subtitle="Connect Dhanveer with Rasik and other systems" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🤝</span>
            <h2 className="text-base font-semibold text-slate-900">Rasik Integration</h2>
            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
              {rasikConfig?.enabled ? "Connected" : "Not configured"}
            </span>
          </div>
          <p className="text-sm text-slate-500 ml-9">
            Rasik is The Tea Planet&apos;s conversational commerce bot. When connected, leads from Rasik
            conversations automatically appear in Dhanveer, and Dhanveer can trigger Rasik messages.
          </p>
        </div>
        <RasikSettingsClient initial={rasikConfig ? { id: rasikConfig.id, baseUrl: rasikConfig.baseUrl, apiKey: rasikConfig.apiKey, enabled: rasikConfig.enabled } : null} />
      </div>
    </div>
  );
}
