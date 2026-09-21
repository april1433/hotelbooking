"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, StatusBadge, Button } from "@/components/ui";
import { CalendarDays, BedDouble, Clock, Eye, XCircle, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reservation = Record<string, any>;

export default function GuestReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function fetchReservations() {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    try {
      // Primary query: by profile_id (set when user is logged in during booking)
      const { data: byProfile } = await (supabase as any)
        .from("reservations")
        .select(`
          id, confirmation_number, status, check_in_date, check_out_date, total_amount,
          room_types(name),
          rooms(room_number)
        `)
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });

      // Secondary query: by guest email (covers cases where user booked without profile_id linked)
      const userEmail = user.email;
      let byEmail: Reservation[] = [];
      if (userEmail) {
        // Find guest records matching this email
        const { data: guestRecords } = await (supabase as any)
          .from("guests")
          .select("id")
          .eq("email", userEmail);

        if (guestRecords && guestRecords.length > 0) {
          const guestIds = guestRecords.map((g: { id: string }) => g.id);
          const { data: emailReservations } = await (supabase as any)
            .from("reservations")
            .select(`
              id, confirmation_number, status, check_in_date, check_out_date, total_amount,
              room_types(name),
              rooms(room_number)
            `)
            .in("guest_id", guestIds)
            .order("created_at", { ascending: false });
          byEmail = (emailReservations ?? []) as Reservation[];
        }
      }

      // Merge and deduplicate by id
      const all = [...(byProfile ?? []), ...byEmail];
      const seen = new Set<string>();
      const merged = all.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });

      setReservations(merged);
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReservations();

    // Handle redirect from payment gateways
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      const success = params.get("success");

      // GCash success redirect
      if (success === "true") {
        toast.success("Booking confirmed! Welcome to Grand Azure.");
        // Clean URL without reloading
        window.history.replaceState({}, "", window.location.pathname);
        // Fetch again after a short delay to ensure DB has been written
        setTimeout(() => fetchReservations(), 1000);
      }

      // Stripe session verify
      if (sessionId) {
        fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
          .then(res => res.json())
          .then(res => {
            if (res.success) {
              toast.success("Booking confirmed! Welcome to Grand Azure.");
              fetchReservations();
            }
          })
          .catch(() => {});
      }
    }

    const interval = setInterval(() => {
      fetchReservations();
    }, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = reservations.filter(r =>
    filter === "all" || r.status === filter
  );

  const stats = {
    upcoming: reservations.filter(r => r.status === "confirmed" || r.status === "pending").length,
    completed: reservations.filter(r => r.status === "checked_out").length,
    totalSpent: reservations.filter(r => !["cancelled", "no_show"].includes(r.status)).reduce((s, r) => s + (r.total_amount ?? 0), 0),
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Reservations</h1>
          <p className="page-subtitle">Your upcoming and past stays at Grand Azure.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchReservations} variant="outline" size="sm" className="rounded-xl">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Link href="/booking">
            <Button variant="gold" size="sm" className="rounded-xl">
              <Plus className="h-3.5 w-3.5 mr-2" /> New Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Upcoming", value: loading ? "—" : stats.upcoming, icon: CalendarDays, color: "text-gold-600" },
          { label: "Completed Stays", value: loading ? "—" : stats.completed, icon: BedDouble, color: "text-navy-600 dark:text-navy-400" },
          { label: "Total Spent", value: loading ? "—" : formatCurrency(stats.totalSpent), icon: Clock, color: "text-emerald-600" },
        ].map((s, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-0 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "confirmed", "checked_in", "checked_out", "cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${filter === f ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}>
            {f === "all" ? "All Reservations" : f.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Reservations */}
      {!loading && (
        <div className="space-y-4">
          {filtered.map(r => (
            <Card key={r.id} className="group hover:shadow-luxury-hover transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl font-bold font-display">
                        {r.rooms?.room_number ? `Room ${r.rooms.room_number}` : (r.room_types?.name ?? "Booking Confirmed")}
                      </span>
                      {r.rooms?.room_number && (
                        <span className="text-xs text-muted-foreground">{r.room_types?.name ?? "Room"}</span>
                      )}
                      <StatusBadge status={r.status} />
                    </div>
                    {!r.rooms?.room_number && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Room will be assigned before check-in</p>
                    )}
                    <p className="text-xs text-muted-foreground">Confirmation Number: {r.confirmation_number ?? r.id.slice(0, 8)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground sm:text-right">
                    <div>Check-In: <span className="text-foreground font-semibold">{r.check_in_date}</span></div>
                    <div>Check-Out: <span className="text-foreground font-semibold">{r.check_out_date}</span></div>
                    <div>Total Cost: <span className="text-gold-600 font-bold">{formatCurrency(r.total_amount ?? 0)}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-border/40 mt-4">
                  <Link href={`/guest/invoices?reservationId=${r.id}`}>
                    <Button variant="outline" size="sm" className="rounded-lg text-xs h-8 gap-1.5">
                      <Eye className="h-3 w-3" /> View Invoice
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm border border-dashed rounded-xl bg-card flex flex-col items-center justify-center gap-2">
              <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-30" />
              No reservations found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
