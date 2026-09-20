"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, StatusBadge, Button, Input } from "@/components/ui";
import { LogOut, Search, CreditCard, Key, CheckCircle2, RefreshCw, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Departure = Record<string, any>;

export default function CheckOutsPage() {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [settledReservations, setSettledReservations] = useState<Record<string, boolean>>({});

  async function fetchDepartures() {
    setLoading(true);
    const supabase = createClient();
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("reservations")
        .select(`
          id, confirmation_number, status, check_in_date, check_out_date, total_amount, source,
          profiles(first_name, last_name),
          rooms(id, room_number, room_types(name, base_price))
        `)
        .eq("check_out_date", today)
        .in("status", ["checked_in", "checked_out"]);
      setDepartures((data ?? []) as any[]);
    } catch {
      setDepartures([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDepartures(); }, []);

  const handlePayBalance = (id: string) => {
    setSettledReservations(prev => ({ ...prev, [id]: true }));
  };

  const handleCheckOut = async (id: string, roomId: string) => {
    const supabase = createClient() as any;
    try {
      // Update reservation status and free the room
      await Promise.all([
        supabase
          .from("reservations")
          .update({ status: "checked_out" })
          .eq("id", id),
        supabase
          .from("rooms")
          .update({ status: "available", cleaning_status: "dirty" })
          .eq("id", roomId),
      ]);
      
      // Update local state
      setDepartures(prev => prev.map(d => d.id === id ? { ...d, status: "checked_out" } : d));
    } catch {
      // Ignored
    }
  };

  const filtered = departures.filter(d => {
    const name = `${d.profiles?.first_name ?? ""} ${d.profiles?.last_name ?? ""}`.toLowerCase();
    const code = (d.confirmation_number ?? d.id ?? "").toLowerCase();
    const room = String(d.rooms?.room_number ?? "").toLowerCase();
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase()) || room.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <LogOut className="h-7 w-7 text-muted-foreground" /> Check-Outs Queue
          </h1>
          <p className="page-subtitle">Settle remaining room charges, accept key returns, and complete check-out.</p>
        </div>
        <Button onClick={fetchDepartures} variant="outline" size="sm" className="rounded-xl">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex max-w-xs relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search departing guests…"
          className="pl-9 h-9 rounded-xl"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* List of Departures */}
      {!loading && (
        <div className="space-y-4">
          {filtered.map(guest => {
            const isSettled = settledReservations[guest.id] || guest.status === "checked_out";
            const roomRate = guest.rooms?.room_types?.base_price ?? 0;
            const totalBalance = isSettled ? 0 : guest.total_amount ?? roomRate;

            return (
              <Card key={guest.id} className={guest.status === "checked_out" ? "opacity-75 bg-muted/20" : ""}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    {/* Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-base">{guest.profiles?.first_name} {guest.profiles?.last_name}</h3>
                        <StatusBadge status={guest.status} />
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{guest.confirmation_number ?? guest.id.slice(0, 8)}</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                        <div>
                          <span className="block font-medium">Room Assigned</span>
                          <span className="text-foreground font-semibold text-sm">{guest.rooms?.room_number ?? "—"}</span> ({guest.rooms?.room_types?.name ?? "Room"})
                        </div>
                        <div>
                          <span className="block font-medium">Total Charges</span>
                          <span className="text-foreground">{formatCurrency(guest.total_amount ?? roomRate)}</span>
                        </div>
                        <div>
                          <span className="block font-medium">Payment Status</span>
                          <span className={`font-semibold ${isSettled ? "text-emerald-600" : "text-amber-600"}`}>
                            {isSettled ? "Fully Settled" : "Pending Payment"}
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium">Outstanding Balance</span>
                          <span className="text-foreground font-bold text-sm text-gold-600">
                            {formatCurrency(totalBalance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2.5 shrink-0 self-end md:self-center">
                      {guest.status === "checked_out" ? (
                        <span className="inline-flex items-center rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4 mr-1.5" /> Room Checked Out
                        </span>
                      ) : (
                        <>
                          {!isSettled && (
                            <Button
                              variant="navy"
                              size="sm"
                              className="rounded-xl text-xs h-9 gap-1.5"
                              onClick={() => handlePayBalance(guest.id)}
                            >
                              <CreditCard className="h-4 w-4" /> Settle Balance
                            </Button>
                          )}
                          <Button
                            variant="gold"
                            size="sm"
                            className="rounded-xl text-xs h-9 gap-1.5"
                            onClick={() => handleCheckOut(guest.id, guest.rooms?.id)}
                            disabled={!isSettled}
                          >
                            <Key className="h-4 w-4" /> Return Key &amp; Check-Out
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm border border-dashed rounded-xl bg-card flex flex-col items-center justify-center gap-2">
              <CalendarDays className="h-6 w-6 opacity-30" />
              No guest check-outs scheduled for today.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
