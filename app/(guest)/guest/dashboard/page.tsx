"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatusBadge, Button } from "@/components/ui";
import { BedDouble, CalendarDays, Receipt, MessageSquarePlus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Stay = Record<string, any>;

export default function GuestDashboardPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingCount: 0,
    totalStays: 0,
    pendingBalance: 0,
  });
  const [upcomingStay, setUpcomingStay] = useState<Stay | null>(null);

  async function fetchDashboardData() {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: resData } = (await supabase
        .from("reservations")
        .select(`
          id, confirmation_number, status, check_in_date, check_out_date, total_amount,
          room_types(name),
          rooms(room_number)
        `)
        .eq("profile_id", user.id)) as any;

      const list = (resData ?? []) as Stay[];
      const upcoming = list.filter(r => r.check_in_date >= today && ["confirmed", "pending"].includes(r.status));
      const historic = list.filter(r => r.status === "checked_out");

      // Pull unpaid invoice sum
      const resIds = list.map(r => r.id);
      let pendingBalance = 0;
      if (resIds.length > 0) {
        const { data: payData } = await supabase
          .from("payments")
          .select("amount")
          .in("reservation_id", resIds)
          .eq("status", "pending");
        const paymentsList = (payData ?? []) as any[];
        pendingBalance = paymentsList.reduce((sum, p) => sum + (p.amount ?? 0), 0);
      }

      setStats({
        upcomingCount: upcoming.length,
        totalStays: historic.length,
        pendingBalance,
      });

      if (upcoming.length > 0) {
        // Grab the closest check-in
        upcoming.sort((a, b) => a.check_in_date.localeCompare(b.check_in_date));
        setUpcomingStay(upcoming[0]);
      } else {
        setUpcomingStay(null);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDashboardData(); }, [user]);

  const name = profile?.first_name || "Valued Guest";

  return (
    <div className="space-y-8 page-transition">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Bonjour, {name}</h1>
          <p className="page-subtitle">Welcome to your luxury retreat console. Let&apos;s arrange your experience.</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm" className="rounded-xl">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Active Bookings</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gold-50 dark:bg-gold-950/50 flex items-center justify-center text-gold-600 dark:text-gold-400">
              <CalendarDays className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-3">
            <div className="text-2xl font-bold">{loading ? "—" : `${stats.upcomingCount} Upcoming`}</div>
            <p className="text-xs text-muted-foreground mt-1">Stays booked at hotel</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Stays</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-navy-50 dark:bg-navy-900/50 flex items-center justify-center text-navy-600 dark:text-navy-400">
              <BedDouble className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-3">
            <div className="text-2xl font-bold">{loading ? "—" : `${stats.totalStays} Historic`}</div>
            <p className="text-xs text-muted-foreground mt-1">Stays completed</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pending Balance</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-3">
            <div className="text-2xl font-bold">{loading ? "—" : formatCurrency(stats.pendingBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Outstanding charges due</p>
          </CardContent>
        </Card>
      </div>

      {loading && <div className="h-56 bg-muted animate-pulse rounded-2xl" />}

      {/* Upcoming Stay Detail Panel */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {upcomingStay ? (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-display">Your Upcoming Sanctuary</CardTitle>
                <CardDescription>Details of your next scheduled stay with us.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">
                        {upcomingStay.rooms?.room_number
                          ? `Room ${upcomingStay.rooms.room_number}`
                          : upcomingStay.room_types?.name ?? "Stay Booked"}
                      </h3>
                      <StatusBadge status={upcomingStay.status} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-light">
                      {upcomingStay.rooms?.room_number
                        ? `Room Category: ${upcomingStay.room_types?.name ?? "Room"}`
                        : "Room number will be assigned by the hotel before your check-in."}
                    </p>
                    <div className="text-xs text-muted-foreground flex gap-4 pt-1 font-mono">
                      <span>In: {upcomingStay.check_in_date}</span>
                      <span>Out: {upcomingStay.check_out_date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
                  <Link href="/guest/reservations">
                    <Button variant="outline" className="rounded-xl text-xs">Manage Booking</Button>
                  </Link>
                  <Link href={`/guest/invoices?reservationId=${upcomingStay.id}`}>
                    <Button variant="gold" className="rounded-xl text-xs">View Invoice</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:col-span-2 border-dashed border-2">
              <CardContent className="py-12 flex flex-col items-center justify-center text-center gap-3">
                <CalendarDays className="h-10 w-10 text-muted-foreground opacity-30" />
                <h3 className="font-semibold text-base">No Upcoming Sanctuary</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  You do not have any upcoming bookings scheduled with us. Begin a new experience.
                </p>
                <Link href="/booking">
                  <Button variant="gold" size="sm" className="rounded-xl mt-1">
                    Book Stay
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Extras panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Personalize Stay</CardTitle>
              <CardDescription>Bespoke room customizers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-normal font-light">
                Add services to your stay before checking in at the front desk.
              </p>
              <div className="space-y-3">
                <Link href="/rooms" className="w-full">
                  <Button variant="gold" className="w-full rounded-xl text-xs justify-start px-4">
                    <MessageSquarePlus className="h-4 w-4 mr-2" /> Explore Luxury Rooms
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
