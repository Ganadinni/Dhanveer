"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const SORT_OPTIONS = [
  { value: "city-grouped", label: "City (grouped)" },
  { value: "newest",       label: "Newest first" },
  { value: "name",         label: "Name A–Z" },
];

const TAG_COLORS: Record<string, string> = {
  "Cafe":                     "bg-amber-50 text-amber-700 ring-amber-200",
  "QSR Chain":                "bg-orange-50 text-orange-700 ring-orange-200",
  "Key Account":              "bg-purple-50 text-purple-700 ring-purple-200",
  "Hotels/Bakery/Restaurant": "bg-blue-50 text-blue-700 ring-blue-200",
  "PAN Asian":                "bg-red-50 text-red-700 ring-red-200",
  "Dessert Stores":           "bg-pink-50 text-pink-700 ring-pink-200",
  "Industrial":               "bg-slate-100 text-slate-700 ring-slate-300",
  "Chef/Consultant":          "bg-teal-50 text-teal-700 ring-teal-200",
  "Distributors":             "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "Export":                   "bg-green-50 text-green-700 ring-green-200",
};

export function LeadsFilterBar({ allTags }: { allTags: string[] }) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const currentSort = params.get("sort") ?? "newest";
  const currentTag  = params.get("tag")  ?? "";

  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }, [params, pathname, router]);

  return (
    <div className="flex flex-wrap items-center gap-2 pb-3">
      {/* Sort selector */}
      <select
        value={currentSort}
        onChange={(e) => update("sort", e.target.value)}
        className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Divider */}
      {allTags.length > 0 && (
        <span className="text-slate-200 text-sm select-none">|</span>
      )}

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <>
          <button
            onClick={() => update("tag", "")}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              !currentTag
                ? "bg-slate-800 text-white"
                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => update("tag", currentTag === tag ? "" : tag)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium ring-1 transition-all ${
                currentTag === tag
                  ? `${TAG_COLORS[tag] ?? "bg-slate-100 text-slate-700 ring-slate-200"} opacity-100`
                  : "bg-white text-slate-500 ring-slate-200 hover:ring-slate-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

export { TAG_COLORS };
