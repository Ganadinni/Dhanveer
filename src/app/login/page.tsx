"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error ?? "Invalid email or password.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] flex flex-col lg:flex-row bg-white">

      {/* ── LEFT — Brand panel ────────────────────────────────────────────── */}
      <div className="relative lg:w-[52%] bg-[#0d3d2a] flex flex-col overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-green-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-16 w-64 h-64 rounded-full bg-green-700/30 blur-2xl pointer-events-none" />

        {/* Grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative flex flex-col h-full px-8 py-8 lg:px-12 lg:py-12">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500 shadow-lg shadow-green-900/40">
              <span className="text-sm font-bold text-white">D</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">Dhanveer</p>
              <p className="text-[10px] text-green-400 leading-none mt-0.5">by The Tea Planet</p>
            </div>
          </div>

          {/* Main headline */}
          <div className="py-10 lg:py-0 lg:my-auto">
            <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/25 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-300 font-medium">India&apos;s #1 Bubble Tea Manufacturer</span>
            </div>

            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-[1.15] mb-4">
              Close more deals.<br />
              <span className="text-green-400">Faster.</span>
            </h1>
            <p className="text-green-200/70 text-sm lg:text-base leading-relaxed max-w-sm">
              Your complete sales intelligence system — research leads, generate pitches,
              and track every conversation from first contact to order.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              {[
                { value: "500+", label: "Partners" },
                { value: "200%+", label: "Gross margin" },
                { value: "13 yrs", label: "In market" },
              ].map(({ value, label }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-center">
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-[10px] text-green-300/70 mt-0.5 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer quote */}
          <div className="mt-auto pt-8 hidden lg:block border-t border-white/10">
            <p className="text-sm text-green-200/50 italic leading-relaxed">
              &ldquo;Ready in 7 days. No new equipment. 200% margins per cup.&rdquo;
            </p>
            <p className="text-xs text-green-400/50 mt-1">— The Tea Planet promise</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 bg-white">

        <div className="w-full max-w-sm">

          {/* Mobile-only logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <span className="text-xs font-bold text-white">D</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">Dhanveer</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to your sales workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@theteaplanet.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-lg shadow-green-600/25 hover:shadow-green-600/40 hover:-translate-y-px active:translate-y-0 disabled:hover:translate-y-0 disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Internal tool · The Tea Planet · Since 2011
          </p>
        </div>
      </div>

    </main>
  );
}
