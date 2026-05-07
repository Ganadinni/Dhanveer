"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

const LEAD_FIELDS = [
  { key: "businessName", label: "Business Name", required: true },
  { key: "ownerName", label: "Owner Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "pincode", label: "Pincode" },
  { key: "address", label: "Address" },
  { key: "notes", label: "Notes" },
];

type ColumnMap = Record<string, string>; // leadField -> fileColumn

export function ImportCsvClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [colMap, setColMap] = useState<ColumnMap>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!json.length) return;
      const hdrs = Object.keys(json[0]);
      setHeaders(hdrs);
      setRows(json);
      setResult(null);

      // Auto-map columns by fuzzy matching
      const auto: ColumnMap = {};
      for (const field of LEAD_FIELDS) {
        const match = hdrs.find((h) =>
          h.toLowerCase().replace(/[\s_]/g, "").includes(field.key.toLowerCase().replace(/[\s_]/g, "")) ||
          field.label.toLowerCase().replace(/[\s_]/g, "").includes(h.toLowerCase().replace(/[\s_]/g, ""))
        );
        if (match) auto[field.key] = match;
      }
      setColMap(auto);
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleImport() {
    if (!colMap.businessName) return;
    setImporting(true);

    const mapped = rows.map((row) => {
      const entry: Record<string, string> = {};
      for (const field of LEAD_FIELDS) {
        const col = colMap[field.key];
        if (col) entry[field.key] = String(row[col] ?? "");
      }
      return entry;
    });

    const res = await fetch("/api/leads/import-bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: mapped }),
    });

    const data = await res.json();
    setResult(data);
    setImporting(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Upload zone */}
      {!rows.length && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
            dragOver ? "border-green-400 bg-green-50" : "border-slate-300 bg-white hover:border-green-400 hover:bg-green-50"
          }`}
        >
          <span className="text-4xl">📂</span>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">Drop your file here or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, .csv</p>
          </div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        </div>
      )}

      {/* File loaded — column mapper */}
      {rows.length > 0 && !result && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Map Columns</p>
                <p className="text-xs text-slate-400 mt-0.5">{rows.length} rows loaded · Match your file columns to lead fields</p>
              </div>
              <button
                onClick={() => { setRows([]); setHeaders([]); setColMap({}); }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Change file
              </button>
            </div>

            <div className="space-y-2">
              {LEAD_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <div className="w-36 shrink-0">
                    <span className="text-xs font-medium text-slate-600">{field.label}</span>
                    {field.required && <span className="text-red-500 ml-1 text-xs">*</span>}
                  </div>
                  <select
                    value={colMap[field.key] ?? ""}
                    onChange={(e) => setColMap((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">— Skip —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  {colMap[field.key] && (
                    <span className="text-xs text-green-600 shrink-0">✓ mapped</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-sm font-semibold text-slate-700">Preview (first 5 rows)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    {LEAD_FIELDS.filter((f) => colMap[f.key]).map((f) => (
                      <th key={f.key} className="text-left px-4 py-2 font-medium text-slate-500 whitespace-nowrap">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {LEAD_FIELDS.filter((f) => colMap[f.key]).map((f) => (
                        <td key={f.key} className="px-4 py-2 text-slate-700 max-w-[160px] truncate">
                          {String(row[colMap[f.key]] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={importing || !colMap.businessName}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {importing ? `Importing ${rows.length} rows…` : `Import ${rows.length} Leads`}
          </button>
          {!colMap.businessName && (
            <p className="text-xs text-red-500 text-center -mt-3">Map the Business Name column to continue</p>
          )}
        </>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <p className="text-5xl">{result.created > 0 ? "✅" : "⚠️"}</p>
          <div>
            <p className="text-xl font-bold text-slate-900">{result.created} leads imported</p>
            {result.skipped > 0 && (
              <p className="text-sm text-slate-400 mt-1">{result.skipped} skipped (duplicates or missing name)</p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard/leads")}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg"
            >
              View Leads
            </button>
            <button
              onClick={() => { setRows([]); setHeaders([]); setColMap({}); setResult(null); }}
              className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium px-6 py-2.5 rounded-lg"
            >
              Import Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
