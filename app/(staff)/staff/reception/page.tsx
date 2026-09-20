"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatusBadge, Button } from "@/components/ui";
import { LogIn, LogOut, CalendarDays, UserPlus, RefreshCw, Sparkles, BedDouble, Wrench } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeedItem = Record<string, any>;

export default function ReceptionDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingCheckins: 0,
    pendingCheckouts: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    dirtyRooms: 0,
  });
  const [arrivals, setArrivals] = useState<FeedItem[]>([]);
  const [departures, setDepartures] = useState<FeedItem[]>([]);

  async function fetchDashboardData() {
    setLoading(true);
    const supabase = createClient();
    try {
      const today = new Date().toISOString().slice(0, 10);

      const [roomsRes, reservationsRes] = await Promise.all([
        supabase.from("rooms").select("status, cleaning_status"),
        supabase.from("reservations").select(`
          id, confirmation_number, status, check_in_date, check_out_date,
          profiles(first_name, last_name),
          rooms(room_number, room_types(name))
        `)
      ]);

      const rooms = (roomsRes.data ?? []) as any[];
      const reservations = (reservationsRes.data ?? []) as any[];

      const pendingCheckins = reservations.filter(r => r.check_in_date === today && ["confirmed", "pending"].includes(r.status)).length;
      const pendingCheckouts = reservations.filter(r => r.check_out_date === today && r.status === "checked_in").length;
      const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
      const availableRooms = rooms.filter(r => r.status === "available").length;
      const dirtyRooms = rooms.filter(r => r.cleaning_status === "dirty").length;

      setStats({ pendingCheckins, pendingCheckouts, occupiedRooms, availableRooms, dirtyRooms });

      // Daily arrivals queue
      const dailyArrivals = reservations.filter(r => r.check_in_date === today && ["confirmed", "pending"].includes(r.status));
      setArrivals(dailyArrivals);

      // Daily departures queue
      const dailyDepartures = reservations.filter(r => r.check_out_date === today && r.status === "checked_in");
      setDepartures(dailyDepartures);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDashboardData(); }, []);

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Front Desk Console</h1>
          <p className="page-subtitle">Manage guest reception, arrivals, departures, and key allocations.</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm" className="rounded-xl border-border/80">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Pending Check-Ins", value: stats.pendingCheckins, color: "text-gold-600 bg-gold-50 dark:bg-gold-950/30" },
          { label: "Pending Check-Outs", value: stats.pendingCheckouts, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
          { label: "Occupied Rooms", value: stats.occupiedRooms, color: "text-navy-600 dark:text-navy-400 bg-navy-50 dark:bg-navy-950/30" },
          { label: "Available Rooms", value: stats.availableRooms, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Needs Housekeeping", value: stats.dirtyRooms, color: "text-red-500 bg-red-50 dark:bg-red-950/30" },
        ].map((s, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{s.label}</p>
              <p className={`text-2xl font-bold rounded-lg px-2.5 py-1 w-fit ${s.color}`}>{loading ? "—" : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Actions Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/staff/reception/walkin" className="block">
          <Card className="hover:shadow-luxury-hover transition-all duration-300 cursor-pointer h-full border-dashed border-2 hover:border-gold-400">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <div className="w-12 h-12 rounded-xl bg-gold-50 dark:bg-gold-950/30 text-gold-600 flex items-center justify-center mb-3">
                <UserPlus className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm">Create Walk-In Reservation</h3>
              <p className="text-xs text-muted-foreground mt-1">Directly book and check-in a walk-in guest.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/staff/reception/checkins" className="block">
          <Card className="hover:shadow-luxury-hover transition-all duration-300 cursor-pointer h-full border-dashed border-2 hover:border-navy-400">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <div className="w-12 h-12 rounded-xl bg-navy-50 dark:bg-navy-900/30 text-navy-600 dark:text-navy-400 flex items-center justify-center mb-3">
                <LogIn className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm">Process Today's Check-Ins</h3>
              <p className="text-xs text-muted-foreground mt-1">Review guest IDs, payment deposits, and assign room keys.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/staff/reception/checkouts" className="block">
          <Card className="hover:shadow-luxury-hover transition-all duration-300 cursor-pointer h-full border-dashed border-2 hover:border-emerald-400">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center mb-3">
                <LogOut className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm">Process Today's Check-Outs</h3>
              <p className="text-xs text-muted-foreground mt-1">Finalize room service billing, settle balances, and accept key returns.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Feed Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrivals Feed */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-display">Arrivals Queue</CardTitle>
              <CardDescription>Scheduled check-ins for today.</CardDescription>
            </div>
            <Link href="/staff/reception/checkins">
              <Button variant="ghost" size="sm" className="text-xs">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 border-t border-border/40">
            {loading ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Loading queue…</div>
            ) : arrivals.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <CalendarDays className="h-6 w-6 opacity-30" />
                No check-ins expected today.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {arrivals.map(a => (
                  <div key={a.id} className="p-4 flex justify-between items-center hover:bg-muted/10">
                    <div>
                      <p className="text-sm font-semibold">{a.profiles?.first_name} {a.profiles?.last_name}</p>
                      <p className="text-xs text-muted-foreground">Room {a.rooms?.room_number ?? "—"} ({a.rooms?.room_types?.name ?? "Room"}) · {a.confirmation_number ?? a.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] text-muted-foreground font-mono">{a.check_in_date}</span>
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Departures Feed */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-display">Departures Queue</CardTitle>
              <CardDescription>Guests scheduled to check out today.</CardDescription>
            </div>
            <Link href="/staff/reception/checkouts">
              <Button variant="ghost" size="sm" className="text-xs">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 border-t border-border/40">
            {loading ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Loading queue…</div>
            ) : departures.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <CalendarDays className="h-6 w-6 opacity-30" />
                No departures expected today.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {departures.map(d => (
                  <div key={d.id} className="p-4 flex justify-between items-center hover:bg-muted/10">
                    <div>
                      <p className="text-sm font-semibold">{d.profiles?.first_name} {d.profiles?.last_name}</p>
                      <p className="text-xs text-muted-foreground">Room {d.rooms?.room_number ?? "—"} ({d.rooms?.room_types?.name ?? "Room"}) · {d.confirmation_number ?? d.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] text-muted-foreground font-mono">{d.check_out_date}</span>
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
