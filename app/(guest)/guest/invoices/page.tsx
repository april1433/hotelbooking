"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from "@/components/ui";
import { Download, Receipt, CheckCircle, Clock, Eye, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Invoice = Record<string, any>;

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  failed:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function GuestInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchInvoices() {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    try {
      // Pull completed or pending payments matching reservations of user
      const { data: resData } = await supabase
        .from("reservations")
        .select("id")
        .eq("profile_id", user.id);

      const resIds = ((resData ?? []) as any[]).map(r => r.id);

      if (resIds.length === 0) {
        setInvoices([]);
        setSelected(null);
        return;
      }

      const { data } = await supabase
        .from("payments")
        .select(`
          id, amount, status, created_at, processed_at,
          reservations(
            id,
            confirmation_number,
            check_in_date,
            check_out_date,
            rooms(room_number, room_types(name))
          )
        `)
        .in("reservation_id", resIds)
        .order("created_at", { ascending: false });

      const list = (data ?? []) as any[];
      setInvoices(list);
      
      // Pre-select by reservationId if passed in query string, otherwise select the first item
      const params = new URLSearchParams(window.location.search);
      const resIdParam = params.get("reservationId");
      if (resIdParam) {
        const found = list.find(inv => inv.reservations?.id === resIdParam);
        if (found) {
          setSelected(found);
          setLoading(false);
          return;
        }
      }

      if (list.length > 0) {
        setSelected(list[0]);
      } else {
        setSelected(null);
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setInvoices([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInvoices(); }, [user]);

  const totalBilled = invoices.reduce((s, i) => s + (i.amount ?? 0), 0);
  const pendingAmount = invoices.filter(i => i.status === "pending").reduce((s, i) => s + (i.amount ?? 0), 0);
  const paidCount = invoices.filter(i => i.status === "completed").length;

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Your complete billing history and payment records.</p>
        </div>
        <Button onClick={fetchInvoices} variant="outline" size="sm" className="rounded-xl">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Billed", value: loading ? "—" : formatCurrency(totalBilled), color: "text-foreground" },
          { label: "Pending Amount", value: loading ? "—" : formatCurrency(pendingAmount), color: "text-amber-600" },
          { label: "Paid Invoices", value: loading ? "—" : paidCount, color: "text-emerald-600" },
        ].map((s, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
          </div>
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      )}

      {/* Empty state */}
      {!loading && invoices.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Receipt className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Invoices</h3>
              <p className="text-sm text-muted-foreground mt-1">There are no billing records or transaction history for your account.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice List */}
          <div className="space-y-4">
            {invoices.map(inv => {
              const res = inv.reservations;
              const room = res?.rooms;
              const typeName = room?.room_types?.name ?? "Room";
              const checkIn = res?.check_in_date ?? "";
              const checkOut = res?.check_out_date ?? "";

              return (
                <Card
                  key={inv.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-luxury-hover ${selected?.id === inv.id ? "ring-2 ring-navy-500" : ""}`}
                  onClick={() => setSelected(inv)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold text-sm">Invoice #{inv.id.slice(0, 8)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Room {room?.room_number ?? "—"} ({typeName})</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status] ?? "bg-gray-100"}`}>
                        {inv.status === "completed" ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {inv.status === "completed" ? "Paid" : inv.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-4">
                      <span>{checkIn} → {checkOut}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                      <span className="text-lg font-bold text-gold-600">{formatCurrency(inv.amount ?? 0)}</span>
                      <span className="text-xs text-muted-foreground">Issued {inv.processed_at ? new Date(inv.processed_at).toLocaleDateString() : (inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "")}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Invoice Detail */}
          <div className="sticky top-4">
            {selected ? (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-display">Invoice Detail</CardTitle>
                      <CardDescription>#{selected.id.slice(0, 8)} · Res: {selected.reservations?.confirmation_number ?? "—"}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs">
                      <Download className="h-3 w-3 mr-1.5" /> PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 bg-navy-800 dark:bg-navy-900 rounded-xl text-white">
                    <p className="text-lg font-bold font-display">Grand Azure Hotel</p>
                    <p className="text-xs text-navy-300">123 Azure Boulevard, Makati City, Philippines</p>
                  </div>

                  <div className="space-y-2.5 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Room Charge ({selected.reservations?.rooms?.room_types?.name ?? "Stay"})</span>
                      <span className="font-medium">{formatCurrency(selected.amount ?? 0)}</span>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-4 space-y-2">
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-border/40">
                      <span>Total Amount</span>
                      <span className="text-gold-600">{formatCurrency(selected.amount ?? 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border/40 rounded-xl">
                <Eye className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm">Select an invoice to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
