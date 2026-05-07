import { Header } from "@/components/layout/Header";
import Link from "next/link";

const sections = [
  {
    title: "Users & Roles",
    description: "Manage sales reps, assign roles, and control access.",
    icon: "👤",
    href: "/admin/users",
    live: true,
  },
  {
    title: "Reports",
    description: "Lead source breakdown, rep performance, and pipeline analytics.",
    icon: "📋",
    href: "/admin/reports",
    live: true,
  },
  {
    title: "Integrations",
    description: "Connect Google Places, WhatsApp Business, and Google Sheets.",
    icon: "🔌",
    href: "/admin/integrations",
    live: false,
  },
  {
    title: "AI Settings",
    description: "Configure Claude / OpenAI prompts and automation rules.",
    icon: "🤖",
    href: "/admin/ai",
    live: false,
  },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Admin Panel" subtitle="Configure the Dhanveer Sales Intelligence OS." />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((s) => (
            s.live ? (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-green-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">Live</span>
                </div>
                <h3 className="font-semibold text-slate-800 group-hover:text-green-700 transition-colors">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.description}</p>
              </Link>
            ) : (
              <div
                key={s.href}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm opacity-60"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Coming soon</span>
                </div>
                <h3 className="font-semibold text-slate-800">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.description}</p>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
