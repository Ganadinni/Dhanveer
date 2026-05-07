"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import Link from "next/link";

const SOURCES = ["MANUAL", "GOOGLE_PLACES", "WHATSAPP", "REFERRAL", "WEBSITE", "OTHER"];

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/leads");
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Add New Lead" subtitle="Fill in the business details below.">
        <Link href="/dashboard/leads" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Leads
        </Link>
      </Header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business Name *" name="businessName" required placeholder="Chai Point" />
              <Field label="Owner Name" name="ownerName" placeholder="Rajesh Kumar" />
              <Field label="Phone" name="phone" placeholder="+91 98765 43210" />
              <Field label="Email" name="email" type="email" placeholder="owner@business.com" />
              <Field label="City" name="city" placeholder="Mumbai" />
              <Field label="State" name="state" placeholder="Maharashtra" />
              <Field label="Pincode" name="pincode" placeholder="400001" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                <select
                  name="source"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input
                name="address"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="123 MG Road"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Any relevant notes about this lead…"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium rounded-lg px-5 py-2.5 text-sm transition-colors"
              >
                {loading ? "Saving…" : "Save Lead"}
              </button>
              <Link
                href="/dashboard/leads"
                className="text-slate-600 hover:text-slate-800 font-medium rounded-lg px-5 py-2.5 text-sm border border-slate-200 hover:border-slate-300 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, name, placeholder, required, type = "text",
}: {
  label: string; name: string; placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );
}
