import { Header } from "@/components/layout/Header";

const sections = [
  {
    title: "Users & Roles",
    description: "Manage sales reps, assign roles, and control access.",
    icon: "👤",
    href: "/admin/users",
    status: "Coming soon",
  },
  {
    title: "Integrations",
    description:
      "Connect Google Places, WhatsApp Business, and Google Sheets.",
    icon: "🔌",
    href: "/admin/integrations",
    status: "Coming soon",
  },
  {
    title: "AI Settings",
    description: "Configure Claude / OpenAI prompts and automation rules.",
    icon: "🤖",
    href: "/admin/ai",
    status: "Coming soon",
  },
  {
    title: "Pipeline Stages",
    description: "Customise the lead pipeline stages for your team.",
    icon: "📊",
    href: "/admin/pipeline",
    status: "Coming soon",
  },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Admin Panel"
        subtitle="Configure the Dhanveer Sales Intelligence OS."
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((s) => (
            <div
              key={s.href}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {s.status}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
