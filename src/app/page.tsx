import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col items-center justify-center p-8">
      {/* Logo / Brand */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-white text-3xl font-bold">D</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          Dhanveer
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          Sales Intelligence OS &mdash; The Tea Planet
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 w-full max-w-md">
        <Link
          href="/dashboard"
          className="group flex flex-col items-start gap-2 rounded-2xl border border-green-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-green-300 transition-all"
        >
          <span className="text-2xl">📊</span>
          <h2 className="font-semibold text-slate-800 group-hover:text-green-700">
            Dashboard
          </h2>
          <p className="text-sm text-slate-500">
            View pipeline, stats, and recent activity.
          </p>
        </Link>

        <Link
          href="/admin"
          className="group flex flex-col items-start gap-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
        >
          <span className="text-2xl">⚙️</span>
          <h2 className="font-semibold text-slate-800 group-hover:text-slate-700">
            Admin
          </h2>
          <p className="text-sm text-slate-500">
            Manage users, settings, and integrations.
          </p>
        </Link>
      </div>

      {/* Health check link */}
      <p className="mt-12 text-xs text-slate-400">
        API health:{" "}
        <a
          href="/api/health"
          className="underline underline-offset-2 hover:text-slate-600"
        >
          /api/health
        </a>
      </p>
    </main>
  );
}
