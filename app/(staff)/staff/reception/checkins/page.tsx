"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, StatusBadge, Button, Input } from "@/components/ui";
import { LogIn, Search, Check, FileCheck, Key, RefreshCw, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Arrival = Record<string, any>;

export default function CheckInsPage() {
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedIds, setVerifiedIds] = useState<Record<string, boolean>>({});

  async function fetchArrivals() {
    setLoading(true);
    const supabase = createClient();
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("reservations")
        .select(`
          id, confirmation_number, status, check_in_date, check_out_date, total_amount, source,
          profiles(first_name, last_name),
          rooms(room_number, room_types(name))
        `)
        .eq("check_in_date", today)
        .in("status", ["confirmed", "pending", "checked_in"]);
      setArrivals((data ?? []) as any[]);
    } catch {
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchArrivals(); }, []);

  const verifyID = (id: string) => {
    setVerifiedIds(prev => ({ ...prev, [id]: true }));
  };

  const handleCheckIn = async (id: string) => {
    const supabase = createClient() as any;
    try {
      await supabase
        .from("reservations")
        .update({ status: "checked_in" })
        .eq("id", id);
      
      // Update local state
      setArrivals(prev => prev.map(a => a.id === id ? { ...a, status: "checked_in" } : a));
    } catch {
      // Ignored
    }
  };

  const filtered = arrivals.filter(a => {
    const name = `${a.profiles?.first_name ?? ""} ${a.profiles?.last_name ?? ""}`.toLowerCase();
    const code = (a.confirmation_number ?? a.id ?? "").toLowerCase();
    const room = String(a.rooms?.room_number ?? "").toLowerCase();
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase()) || room.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <LogIn className="h-7 w-7 text-muted-foreground" /> Check-Ins Queue
          </h1>
          <p className="page-subtitle">Verify guest documents, accept security deposits, and assign room keys.</p>
        </div>
        <Button onClick={fetchArrivals} variant="outline" size="sm" className="rounded-xl">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex max-w-xs relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search arriving guests…"
          className="pl-9 h-9 rounded-xl"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* List of Arrivals */}
      {!loading && (
        <div className="space-y-4">
          {filtered.map(guest => {
            const isVerified = verifiedIds[guest.id] || guest.status === "checked_in";
            return (
              <Card key={guest.id} className={guest.status === "checked_in" ? "opacity-75 bg-muted/20" : ""}>
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
                          <span className="block font-medium">Room Assignment</span>
                          <span className="text-foreground font-semibold text-sm">{guest.rooms?.room_number ?? "—"}</span> ({guest.rooms?.room_types?.name ?? "Room"})
                        </div>
                        <div>
                          <span className="block font-medium">Stay Period</span>
                          <span className="text-foreground">{guest.check_in_date} → {guest.check_out_date}</span>
                        </div>
                        <div>
                          <span className="block font-medium">Total Amount</span>
                          <span className="text-foreground font-semibold">PHP {guest.total_amount?.toLocaleString() ?? 0}</span>
                        </div>
                        <div>
                          <span className="block font-medium">Channel</span>
                          <span className="text-foreground capitalize">{guest.source ?? "direct"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2.5 shrink-0 self-end md:self-center">
                      {guest.status === "checked_in" ? (
                        <span className="inline-flex items-center rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <Check className="h-4 w-4 mr-1.5" /> Checked In Successfully
                        </span>
                      ) : (
                        <>
                          {/* ID Verification */}
                          <Button
                            variant={isVerified ? "outline" : "navy"}
                            size="sm"
                            className="rounded-xl text-xs h-9 gap-1.5"
                            onClick={() => verifyID(guest.id)}
                            disabled={isVerified}
                          >
                            <FileCheck className="h-4 w-4" />
                            {isVerified ? "ID Verified" : "Verify Guest ID"}
                          </Button>

                          {/* Check-In Action */}
                          <Button
                            variant="gold"
                            size="sm"
                            className="rounded-xl text-xs h-9 gap-1.5"
                            onClick={() => handleCheckIn(guest.id)}
                            disabled={!isVerified}
                          >
                            <Key className="h-4 w-4" /> Complete Check-In
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
              No arrivals check-ins found for today.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
