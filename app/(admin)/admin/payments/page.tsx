"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, StatusBadge, Button, Input } from "@/components/ui";
import { Search, Download, CreditCard, TrendingUp, RefreshCw, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Payment = Record<string, any>;

const PAYMENT_STATUSES = ["all", "completed", "pending", "failed", "refunded"];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function fetchPayments() {
    setLoading(true);
    const supabase = createClient() as any;
    const { data } = await supabase
      .from("payments")
      .select("*, reservations(confirmation_number, guests(first_name, last_name)), payment_methods(name)")
      .order("created_at", { ascending: false });
    setPayments((data ?? []) as any[]);
    setLoading(false);
  }

  useEffect(() => { fetchPayments(); }, []);

  const filtered = payments.filter(p => {
    const guest = `${p.reservations?.guests?.first_name ?? ""} ${p.reservations?.guests?.last_name ?? ""}`.toLowerCase();
    const code = (p.reservations?.confirmation_number ?? p.id ?? "").toLowerCase();
    const matchSearch = guest.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleExportCSV() {
    if (payments.length === 0) { toast.error("No data to export."); return; }
    const headers = ["Payment ID", "Reservation #", "Guest", "Amount", "Status", "Method", "Date"];
    const rows = payments.map(p => [
      p.id?.slice(0, 8) ?? "",
      p.reservations?.confirmation_number ?? "—",
      `${p.reservations?.guests?.first_name ?? ""} ${p.reservations?.guests?.last_name ?? ""}`.trim(),
      p.amount ?? 0,
      p.status ?? "",
      p.payment_methods?.name ?? p.payment_method ?? "—",
      p.payment_date ?? (p.created_at ? new Date(p.created_at).toLocaleDateString() : ""),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Payments exported as CSV.");
  }

  const completed = payments.filter(p => p.status === "completed");
  const totalRevenue = completed.reduce((s, p) => s + (p.amount ?? 0), 0);
  const pending = payments.filter(p => p.status === "pending").length;

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Payments & Billing</h1>
          <p className="page-subtitle">Track transactions and revenue across all reservations.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPayments} variant="outline" size="sm" className="rounded-xl">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="rounded-xl">
            <Download className="h-3.5 w-3.5 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue",    value: loading ? "—" : formatCurrency(totalRevenue), color: "text-gold-600" },
          { label: "Transactions",     value: loading ? "—" : payments.length, color: "text-foreground" },
          { label: "Completed",        value: loading ? "—" : completed.length, color: "text-emerald-600" },
          { label: "Pending",          value: loading ? "—" : pending, color: "text-amber-500" },
        ].map((s, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search guest or reservation…" className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {PAYMENT_STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${statusFilter === s ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
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
      {!loading && payments.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <CreditCard className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Payments Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Payments will appear here once guests complete transactions.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && payments.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="px-4 py-3 text-left">Guest</th>
                    <th className="px-4 py-3 text-left">Reservation</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-muted/20 border-b border-border/30 last:border-0">
                      <td className="px-4 py-3.5 font-medium">{p.reservations?.guests?.first_name} {p.reservations?.guests?.last_name}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{p.reservations?.confirmation_number ?? "—"}</td>
                      <td className="px-4 py-3.5 text-sm">{p.payment_methods?.name ?? p.payment_method ?? "—"}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gold-600">{formatCurrency(p.amount ?? 0)}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{p.payment_date ?? (p.created_at ? new Date(p.created_at).toLocaleDateString() : "—")}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-center">
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">No payments match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
