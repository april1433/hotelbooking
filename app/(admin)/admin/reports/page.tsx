"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from "@/components/ui";
import { Download, TrendingUp, BedDouble, Users, CreditCard, BarChart3, RefreshCw, CalendarRange } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportData = {
  totalRevenue: number;
  occupancyRate: number;
  totalGuests: number;
  adr: number;
  monthlyRevenue: { month: string; revenue: number }[];
  sources: { source: string; pct: number; color: string }[];
  roomPerformance: { type: string; bookings: number; revenue: number; occupancy: number }[];
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchReportData() {
    setLoading(true);
    const supabase = createClient();
    try {
      // Fetch rooms, payments, and reservations to calculate YTD stats
      const [paymentsRes, reservationsRes, roomsRes, guestCountRes] = await Promise.all([
        supabase.from("payments").select("amount, status, created_at").eq("status", "completed"),
        supabase.from("reservations").select("id, status, total_amount, source, check_in_date, check_out_date"),
        supabase.from("rooms").select("id, status"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "guest"),
      ]);

      const payments = (paymentsRes.data ?? []) as any[];
      const reservations = (reservationsRes.data ?? []) as any[];
      const rooms = (roomsRes.data ?? []) as any[];
      const totalGuests = guestCountRes.count ?? 0;

      const totalRevenue = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
      const activeRooms = rooms.filter(r => r.status === "occupied").length;
      const occupancyRate = rooms.length > 0 ? Math.round((activeRooms / rooms.length) * 100) : 0;

      // Avg Daily Rate (ADR) = Room Revenue / Rooms Sold
      const roomsSold = reservations.filter(r => ["checked_in", "checked_out"].includes(r.status)).length;
      const adr = roomsSold > 0 ? totalRevenue / roomsSold : 0;

      // Group monthly revenue
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyMap: Record<string, number> = {};
      monthNames.forEach(m => { monthlyMap[m] = 0; });

      payments.forEach(p => {
        if (p.created_at) {
          const m = monthNames[new Date(p.created_at).getMonth()];
          monthlyMap[m] = (monthlyMap[m] || 0) + (p.amount ?? 0);
        }
      });

      const monthlyRevenue = monthNames.map(month => ({
        month,
        revenue: monthlyMap[month] ?? 0,
      }));

      // Booking sources distribution
      const sourceCounts: Record<string, number> = {};
      reservations.forEach(r => {
        const src = r.source ?? "direct";
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      });

      const totalRes = reservations.length;
      const sourceColors: Record<string, string> = {
        direct: "bg-navy-500",
        walk_in: "bg-emerald-500",
        ota: "bg-gold-500",
        phone: "bg-amber-400",
        email: "bg-purple-500",
      };

      const sources = Object.entries(sourceCounts).map(([source, count]) => ({
        source: source.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        pct: totalRes > 0 ? Math.round((count / totalRes) * 100) : 0,
        color: sourceColors[source] ?? "bg-slate-400",
      }));

      // Room performance
      setData({
        totalRevenue,
        occupancyRate,
        totalGuests,
        adr,
        monthlyRevenue,
        sources,
        roomPerformance: [],
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchReportData(); }, []);

  function handleExportCSV() {
    if (!data) { toast.error("No report data to export."); return; }
    const lines = [
      ["Metric", "Value"],
      ["Total Revenue (YTD)", formatCurrency(data.totalRevenue)],
      ["Occupancy Rate", `${data.occupancyRate}%`],
      ["Total Guests", data.totalGuests],
      ["Average Daily Rate", formatCurrency(data.adr)],
      ["", ""],
      ["Month", "Revenue"],
      ...data.monthlyRevenue.map(m => [m.month, formatCurrency(m.revenue)]),
      ["", ""],
      ["Booking Source", "Share (%)"],
      ...data.sources.map(s => [s.source, `${s.pct}%`]),
    ];
    const csv = lines.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Report exported as CSV.");
  }

  const hasData = data && (data.totalRevenue > 0 || data.totalGuests > 0);

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          <p className="page-subtitle">Monthly performance overview and key business metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchReportData} variant="outline" size="sm" className="rounded-xl">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="rounded-xl border-border/80" disabled={!hasData}>
            <Download className="h-3.5 w-3.5 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* KPI Summary Row */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "YTD Revenue", value: data ? formatCurrency(data.totalRevenue) : "PHP 0", icon: TrendingUp, color: "text-emerald-500" },
            { label: "Avg Occupancy", value: data ? `${data.occupancyRate}%` : "0%", icon: BedDouble, color: "text-navy-500 dark:text-navy-400" },
            { label: "Total Guests", value: data ? data.totalGuests.toLocaleString() : "0", icon: Users, color: "text-purple-500" },
            { label: "Avg Daily Rate", value: data ? formatCurrency(data.adr) : "PHP 0", icon: CreditCard, color: "text-gold-500" },
          ].map((k, i) => (
            <Card key={i} className="stat-card">
              <CardContent className="p-0">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{k.label}</p>
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
                <p className="text-xl font-bold">{k.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Calculated from live database</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !hasData && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <CalendarRange className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Performance Data Yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                There are no completed check-ins or payments to generate performance reports.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports charts - only show if there is data */}
      {!loading && hasData && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-display">Monthly Revenue</CardTitle>
              <CardDescription>Revenue trend for the current year.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-48">
                {data.monthlyRevenue.map((d) => {
                  const maxRevenue = Math.max(...data.monthlyRevenue.map(m => m.revenue)) || 1;
                  const height = Math.round((d.revenue / maxRevenue) * 100);
                  return (
                    <div key={d.month} className="flex flex-col items-center flex-1 gap-1.5">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {d.revenue > 0 ? `${(d.revenue / 1000).toFixed(0)}k` : "—"}
                      </span>
                      <div className="w-full rounded-t-md transition-all duration-500 bg-gradient-to-t from-navy-700 to-navy-500 hover:from-gold-500 hover:to-gold-400 cursor-pointer"
                        style={{ height: `${height}%`, minHeight: "8px" }} />
                      <span className="text-xs text-muted-foreground font-medium">{d.month}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Booking Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Booking Sources</CardTitle>
              <CardDescription>Distribution by channel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.sources.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">No booking sources recorded yet.</p>
              ) : (
                data.sources.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">{s.source}</span>
                      <span className="text-xs font-semibold">{s.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color} transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
