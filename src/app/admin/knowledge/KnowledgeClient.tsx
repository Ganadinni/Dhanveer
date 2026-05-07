"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  _count?: { products: number };
}

interface Product {
  id: string;
  sku: string | null;
  name: string;
  categoryId: string;
  category: { id: string; name: string };
  description: string | null;
  targetCustomers: string | null;
  usages: string | null;
  keyBenefits: string | null;
  hsnCode: string | null;
  gstRate: number | null;
  mrp: number | null;
  dealerPrice: number | null;
  moq: string | null;
  packSize: string | null;
  shelfLife: string | null;
  isActive: boolean;
}

const EMPTY_PRODUCT: Omit<Product, "id" | "category"> = {
  sku: "",
  name: "",
  categoryId: "",
  description: "",
  targetCustomers: "",
  usages: "",
  keyBenefits: "",
  hsnCode: "",
  gstRate: 18,
  mrp: null,
  dealerPrice: null,
  moq: "",
  packSize: "",
  shelfLife: "",
  isActive: true,
};

export function KnowledgeClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [modal, setModal] = useState<"closed" | "add" | "edit">("closed");
  const [form, setForm] = useState<typeof EMPTY_PRODUCT>(EMPTY_PRODUCT);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/knowledge/categories").then((r) => r.json()),
      fetch("/api/admin/knowledge/products").then((r) => r.json()),
    ]).then(([cats, prods]) => {
      setCategories(cats);
      setProducts(prods);
      if (cats.length) setActiveCat("all");
    });
  }, []);

  const visible = products.filter((p) => {
    const matchCat = activeCat === "all" || p.categoryId === activeCat;
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q) || (p.targetCustomers ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  function openAdd() {
    setForm({ ...EMPTY_PRODUCT, categoryId: activeCat !== "all" ? activeCat : (categories[0]?.id ?? "") });
    setEditId(null);
    setModal("add");
  }

  function openEdit(p: Product) {
    setForm({
      sku: p.sku ?? "",
      name: p.name,
      categoryId: p.categoryId,
      description: p.description ?? "",
      targetCustomers: p.targetCustomers ?? "",
      usages: p.usages ?? "",
      keyBenefits: p.keyBenefits ?? "",
      hsnCode: p.hsnCode ?? "",
      gstRate: p.gstRate ?? 18,
      mrp: p.mrp,
      dealerPrice: p.dealerPrice,
      moq: p.moq ?? "",
      packSize: p.packSize ?? "",
      shelfLife: p.shelfLife ?? "",
      isActive: p.isActive,
    });
    setEditId(p.id);
    setModal("edit");
  }

  async function handleSave() {
    if (!form.name || !form.categoryId) return;
    setSaving(true);
    const payload = {
      ...form,
      sku: form.sku || null,
      gstRate: form.gstRate ? Number(form.gstRate) : null,
      mrp: form.mrp ? Number(form.mrp) : null,
      dealerPrice: form.dealerPrice ? Number(form.dealerPrice) : null,
    };

    let res: Response;
    if (modal === "add") {
      res = await fetch("/api/admin/knowledge/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      res = await fetch(`/api/admin/knowledge/products/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }

    const updated = await res.json();
    if (modal === "add") {
      setProducts((prev) => [...prev, updated]);
    } else {
      setProducts((prev) => prev.map((p) => (p.id === editId ? updated : p)));
    }
    setSaving(false);
    setModal("closed");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product from the knowledge base?")) return;
    await fetch(`/api/admin/knowledge/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Sidebar — categories */}
      <div className="w-48 shrink-0 space-y-1 pt-1">
        <button
          onClick={() => setActiveCat("all")}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCat === "all" ? "bg-green-600 text-white" : "hover:bg-slate-100 text-slate-700"}`}
        >
          All Products
          <span className="ml-1 text-xs opacity-70">({products.length})</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors leading-snug ${activeCat === cat.id ? "bg-green-600 text-white" : "hover:bg-slate-100 text-slate-700"}`}
          >
            {cat.name}
            <span className="ml-1 text-xs opacity-70">({cat._count?.products ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, SKUs, customer types…"
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button onClick={openAdd} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
            + Add Product
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-sm">No products found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{p.name}</span>
                      {p.sku && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">{p.sku}</span>}
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">{p.category.name}</span>
                      {!p.isActive && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
                    </div>
                    {p.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                      {p.hsnCode && <span>HSN: <b className="text-slate-700">{p.hsnCode}</b></span>}
                      {p.gstRate != null && <span>GST: <b className="text-slate-700">{p.gstRate}%</b></span>}
                      {p.mrp != null && <span>MRP: <b className="text-slate-700">₹{p.mrp}</b></span>}
                      {p.dealerPrice != null && <span>Dealer: <b className="text-slate-700">₹{p.dealerPrice}</b></span>}
                      {p.moq && <span>MOQ: <b className="text-slate-700">{p.moq}</b></span>}
                      {p.packSize && <span>Pack: <b className="text-slate-700">{p.packSize}</b></span>}
                    </div>
                    {p.targetCustomers && (
                      <p className="text-xs text-slate-400 mt-1">
                        <span className="font-medium text-slate-500">Targets:</span> {p.targetCustomers}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(p)} className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 hover:border-slate-300">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded border border-red-100 hover:border-red-300">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== "closed" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{modal === "add" ? "Add Product" : "Edit Product"}</h2>
              <button onClick={() => setModal("closed")} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Product Name *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">SKU</label>
                  <input value={form.sku ?? ""} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="BBT-TARO-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Category *</label>
                  <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Description</label>
                <textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Target Customers</label>
                <input value={form.targetCustomers ?? ""} onChange={(e) => setForm((f) => ({ ...f, targetCustomers: e.target.value }))} placeholder="cafes, hotels, QSR, hospitals…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Usages / Applications</label>
                <textarea value={form.usages ?? ""} onChange={(e) => setForm((f) => ({ ...f, usages: e.target.value }))} rows={2} placeholder="How and where the product is used" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Key Benefits (for pitch)</label>
                <textarea value={form.keyBenefits ?? ""} onChange={(e) => setForm((f) => ({ ...f, keyBenefits: e.target.value }))} rows={2} placeholder="What makes this product great to sell" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">HSN Code</label>
                  <input value={form.hsnCode ?? ""} onChange={(e) => setForm((f) => ({ ...f, hsnCode: e.target.value }))} placeholder="2101" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">GST Rate (%)</label>
                  <input type="number" value={form.gstRate ?? ""} onChange={(e) => setForm((f) => ({ ...f, gstRate: Number(e.target.value) }))} placeholder="18" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">MRP (₹)</label>
                  <input type="number" value={form.mrp ?? ""} onChange={(e) => setForm((f) => ({ ...f, mrp: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Dealer Price (₹)</label>
                  <input type="number" value={form.dealerPrice ?? ""} onChange={(e) => setForm((f) => ({ ...f, dealerPrice: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">MOQ</label>
                  <input value={form.moq ?? ""} onChange={(e) => setForm((f) => ({ ...f, moq: e.target.value }))} placeholder="1 box (25 sachets)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Pack Size</label>
                  <input value={form.packSize ?? ""} onChange={(e) => setForm((f) => ({ ...f, packSize: e.target.value }))} placeholder="500g pouch (20 servings)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Shelf Life</label>
                  <input value={form.shelfLife ?? ""} onChange={(e) => setForm((f) => ({ ...f, shelfLife: e.target.value }))} placeholder="12 months" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-green-600" />
                    Active (visible to AI)
                  </label>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setModal("closed")} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.categoryId} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg">
                {saving ? "Saving…" : modal === "add" ? "Add Product" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
