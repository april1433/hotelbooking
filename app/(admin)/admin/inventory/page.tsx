"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { Search, Plus, Package, RefreshCw, AlertTriangle, Edit, X, Loader2, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InventoryItem = Record<string, any>;

const CATEGORIES = ["all", "bedding", "toiletries", "minibar", "cleaning_supplies", "towels", "electronics", "furniture", "food_beverage", "other"];
const FIELD_CLASS = "w-full h-9 rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/40";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("linens");
  const [unit, setUnit] = useState("pcs");
  const [quantity, setQuantity] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [notes, setNotes] = useState("");

  async function fetchItems() {
    setLoading(true);
    const supabase = createClient() as any;
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchItems(); }, []);

  function openAddModal() {
    setEditingItem(null);
    setName(""); setCategory("bedding"); setUnit("pcs"); setQuantity(""); setReorderLevel(""); setNotes("");
    setShowModal(true);
  }

  function openEditModal(item: InventoryItem) {
    setEditingItem(item);
    setName(item.name ?? "");
    setCategory(item.category ?? "bedding");
    setUnit(item.unit ?? "pcs");
    setQuantity(String(item.quantity ?? ""));
    setReorderLevel(String(item.min_quantity ?? item.reorder_level ?? ""));
    setNotes(item.notes ?? "");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || quantity === "") { toast.error("Name and quantity are required."); return; }

    setSubmitting(true);
    const supabase = createClient() as any;
    try {
      const payload = {
        name: name.trim(),
        category,
        unit: unit.trim() || "pcs",
        quantity: parseInt(quantity, 10),
        min_quantity: reorderLevel !== "" ? parseInt(reorderLevel, 10) : null,
        notes: notes.trim() || null,
      };

      if (editingItem) {
        const { error } = await supabase.from("inventory").update(payload).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Inventory item updated.");
      } else {
        const { error } = await supabase.from("inventory").insert(payload);
        if (error) throw error;
        toast.success("Inventory item added.");
      }

      setShowModal(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Failed to save item.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleExportCSV() {
    if (items.length === 0) { toast.error("No data to export."); return; }
    const headers = ["Name", "Category", "Unit", "Quantity", "Reorder Level", "Status"];
    const rows = items.map(it => [
      it.name ?? "",
      it.category ?? "",
      it.unit ?? "pcs",
      it.quantity ?? 0,
      it.min_quantity ?? it.reorder_level ?? "",
      it.quantity <= (it.min_quantity ?? it.reorder_level ?? 0) ? "Low Stock" : "OK",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Inventory exported as CSV.");
  }

  const filtered = items.filter(it => {
    const matchSearch = (it.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || it.category === catFilter;
    return matchSearch && matchCat;
  });

  const lowStock = items.filter(it => it.quantity <= (it.min_quantity ?? it.reorder_level ?? 0)).length;

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Track hotel supplies and manage stock levels.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="rounded-xl">
            <Download className="h-3.5 w-3.5 mr-2" /> Export
          </Button>
          <Button onClick={fetchItems} variant="outline" size="sm" className="rounded-xl">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={openAddModal} variant="gold" size="sm" className="rounded-xl">
            <Plus className="h-3.5 w-3.5 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Items",  value: loading ? "—" : items.length, color: "text-foreground" },
          { label: "Low Stock",    value: loading ? "—" : lowStock, color: lowStock > 0 ? "text-red-500" : "text-emerald-600" },
          { label: "Categories",   value: loading ? "—" : new Set(items.map(i => i.category)).size, color: "text-navy-600 dark:text-navy-400" },
        ].map((s, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low stock alert */}
      {!loading && lowStock > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">{lowStock} item{lowStock > 1 ? "s" : ""} are running low and need restocking.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items…" className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${catFilter === c ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}>
              {c === "all" ? "All" : c.replace(/_/g, " ").replace(/\b\w/g, ch => ch.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Inventory Items</h3>
              <p className="text-sm text-muted-foreground mt-1">Add your first inventory item to start tracking supplies.</p>
            </div>
            <Button onClick={openAddModal} variant="gold" size="sm" className="rounded-xl mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add First Item
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && items.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Unit</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Reorder Level</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(it => {
                    const isLow = it.quantity <= (it.min_quantity ?? it.reorder_level ?? 0);
                    return (
                      <tr key={it.id} className={`hover:bg-muted/20 border-b border-border/30 last:border-0 ${isLow ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}>
                        <td className="px-4 py-3.5 font-medium">{it.name}</td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground capitalize">{it.category ?? "—"}</td>
                        <td className="px-4 py-3.5 text-sm">{it.unit ?? "pcs"}</td>
                        <td className="px-4 py-3.5 text-right font-bold">{it.quantity}</td>
                        <td className="px-4 py-3.5 text-right text-sm text-muted-foreground">{it.min_quantity ?? it.reorder_level ?? "—"}</td>
                        <td className="px-4 py-3.5">
                          {isLow
                            ? <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><AlertTriangle className="h-3 w-3" /> Low Stock</span>
                            : <span className="text-xs text-emerald-600 font-medium">OK</span>
                          }
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-center">
                            <button onClick={() => openEditModal(it)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit">
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">No items match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md border border-border/60">
            <div className="flex items-center justify-between p-6 border-b border-border/40">
              <div>
                <h2 className="text-lg font-semibold font-display">{editingItem ? "Edit Inventory Item" : "Add New Item"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{editingItem ? "Update item details and stock level." : "Add a new supply item to track inventory."}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Item Name *</label>
                <input className={FIELD_CLASS} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bath Towels" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                  <select className={FIELD_CLASS} value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.filter(c => c !== "all").map(c => (
                      <option key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, ch => ch.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Unit</label>
                  <input className={FIELD_CLASS} value={unit} onChange={e => setUnit(e.target.value)} placeholder="pcs / boxes / kg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Current Quantity *</label>
                  <input type="number" min="0" className={FIELD_CLASS} value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Reorder Level</label>
                  <input type="number" min="0" className={FIELD_CLASS} value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} placeholder="e.g. 10" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
                <input className={FIELD_CLASS} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" size="sm" className="flex-1 rounded-xl" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Saving…</> : editingItem ? "Save Changes" : "Add Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
