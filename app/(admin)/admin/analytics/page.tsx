"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from "@/components/ui";
import { TrendingUp, BedDouble, Star, RefreshCw, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalyticsData = {
  avgLengthOfStay: number;
  revPar: number;
  satisfaction: number;
  cancellationRate: number;
  satisfactionBreakdown: { rating: number; count: number; pct: number }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAnalytics() {
    setLoading(true);
    const supabase = createClient();
    try {
      // Calculate averages from rooms, reservations, and reviews
      const [roomsRes, reservationsRes, reviewsRes] = await Promise.all([
        supabase.from("rooms").select("id, status"),
        supabase.from("reservations").select("id, status, check_in_date, check_out_date, total_amount"),
        supabase.from("reviews").select("rating"),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rooms = (roomsRes.data ?? []) as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reservations = (reservationsRes.data ?? []) as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reviews = (reviewsRes.data ?? []) as any[];

      // Average Length of Stay
      let totalNights = 0;
      let stayCount = 0;
      reservations.forEach(r => {
        if (r.check_in_date && r.check_out_date) {
          const checkIn = new Date(r.check_in_date);
          const checkOut = new Date(r.check_out_date);
          const diff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          if (diff > 0) {
            totalNights += diff;
            stayCount++;
          }
        }
      });
      const avgLengthOfStay = stayCount > 0 ? Math.round((totalNights / stayCount) * 10) / 10 : 0;

      // RevPAR = Total Room Revenue / Total Available Rooms
      const totalRevenue = reservations.filter(r => !["cancelled", "no_show"].includes(r.status)).reduce((s, r) => s + (r.total_amount ?? 0), 0);
      const revPar = rooms.length > 0 ? totalRevenue / rooms.length : 0;

      // Satisfaction from reviews table
      const totalRating = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0);
      const satisfaction = reviews.length > 0 ? Math.round((totalRating / reviews.length) * 10) / 10 : 0;

      // Cancellation rate
      const cancelled = reservations.filter(r => r.status === "cancelled").length;
      const cancellationRate = reservations.length > 0 ? Math.round((cancelled / reservations.length) * 1000) / 10 : 0;

      // Rating breakdown
      const ratings = [5, 4, 3, 2, 1];
      const breakdown = ratings.map(r => {
        const count = reviews.filter(rev => rev.rating === r).length;
        const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
        return { rating: r, count, pct };
      });

      setData({
        avgLengthOfStay,
        revPar,
        satisfaction,
        cancellationRate,
        satisfactionBreakdown: breakdown,
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAnalytics(); }, []);

  const hasData = data && (data.revPar > 0 || data.avgLengthOfStay > 0 || data.satisfaction > 0);

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Deep insights on performance, guests, and satisfaction.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAnalytics} variant="outline" size="sm" className="rounded-xl border-border/80">
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
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

      {/* KPI Row */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Avg Length of Stay", value: data ? `${data.avgLengthOfStay} nights` : "—", change: "Live", up: true },
            { label: "RevPAR", value: data ? formatCurrency(data.revPar) : "PHP 0", change: "Live", up: true },
            { label: "Guest Satisfaction", value: data && data.satisfaction > 0 ? `${data.satisfaction} / 5.0` : "—", change: "Live", up: true },
            { label: "Cancellation Rate", value: data ? `${data.cancellationRate}%` : "0%", change: "Live", up: true },
          ].map((k, i) => (
            <Card key={i} className="stat-card">
              <CardContent className="p-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">{k.label}</p>
                <p className="text-xl font-bold">{k.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Calculated from reservations</p>
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
              <BarChart3 className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Analytics Insights</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Insights and charts will populate once booking patterns and guest reviews are recorded.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Satisfaction breakdown if reviews exist */}
      {!loading && hasData && data && data.satisfaction > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Guest Satisfaction Breakdown</CardTitle>
            <CardDescription>Rating distribution from guest feedback.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="text-center shrink-0">
                <div className="text-6xl font-black text-gold-500">{data.satisfaction}</div>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`h-4 w-4 ${i <= Math.round(data.satisfaction) ? "fill-gold-400 text-gold-400" : "fill-gold-200 text-gold-200"}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Satisfaction index</p>
              </div>
              <div className="flex-1 space-y-2">
                {data.satisfactionBreakdown.map((r) => (
                  <div key={r.rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-14 shrink-0">
                      <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                      <span className="text-xs text-muted-foreground">{r.rating}</span>
                    </div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gold-400 transition-all duration-700"
                        style={{ width: `${r.pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
