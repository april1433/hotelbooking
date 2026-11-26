/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, StatusBadge, Button, Input, Label } from "@/components/ui";
import { CalendarDays, BedDouble, Clock, Eye, XCircle, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

import { toast } from "sonner";

type Reservation = Record<string, any>;

export default function GuestReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancellingRes, setCancellingRes] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Booking Time Extension modal states
  const [extendingRes, setExtendingRes] = useState<Reservation | null>(null);
  const [extensionType, setExtensionType] = useState<"hours" | "days">("hours");
  const [additionalHours, setAdditionalHours] = useState("3");
  const [newCheckOutDate, setNewCheckOutDate] = useState("");
  const [extensionNotes, setExtensionNotes] = useState("");
  const [extendLoading, setExtendLoading] = useState(false);

  const isFetchingRef = useRef(false);

  async function fetchReservations(silent = false) {
    if (!user || isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setLoading(true);
    const supabase = createClient();
    try {
      // Primary query: by profile_id (set when user is logged in during booking)
      const { data: byProfile } = await (supabase as any)
        .from("reservations")
        .select(`
          id, confirmation_number, status, check_in_date, check_out_date, total_amount, paid_amount,
          room_types(name),
          rooms(room_number)
        `)
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });

      // Secondary query: by guest email (covers cases where user booked without profile_id linked)
      const userEmail = user.email;
      let byEmail: Reservation[] = [];
      if (userEmail) {
        const { data: guestRecords } = await (supabase as any)
          .from("guests")
          .select("id")
          .eq("email", userEmail);

        if (guestRecords && guestRecords.length > 0) {
          const guestIds = guestRecords.map((g: { id: string }) => g.id);
          const { data: emailReservations } = await (supabase as any)
            .from("reservations")
            .select(`
              id, confirmation_number, status, check_in_date, check_out_date, total_amount, paid_amount,
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
      if (!silent) setReservations([]);
    } finally {
      isFetchingRef.current = false;
      if (!silent) setLoading(false);
    }
  }

  async function handleConfirmCancel() {
    if (!cancellingRes) return;
    setCancelLoading(true);
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: cancellingRes.id,
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel reservation.");
      }
      toast.success(
        data.paidAmount > 0
          ? `Reservation cancelled! ${formatCurrency(data.refundedAmount)} refunded (10% deduction: ${formatCurrency(data.deductedAmount)}). Confirmation sent to your email.`
          : "Reservation cancelled successfully. Confirmation sent to your email."
      );
      setCancellingRes(null);
      setCancelReason("");
      fetchReservations(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel reservation.");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleConfirmExtend(e: React.FormEvent) {
    e.preventDefault();
    if (!extendingRes) return;
    if (extensionType === "days" && (!newCheckOutDate || newCheckOutDate <= extendingRes.check_out_date)) {
      toast.error("New check-out date must be after your current check-out date.");
      return;
    }

    const timeLabels: Record<string, string> = {
      "2": "+2 Hours (Late Check-Out at 2:00 PM)",
      "3": "+3 Hours (Late Check-Out at 3:00 PM)",
      "6": "+6 Hours (Late Check-Out at 6:00 PM)",
    };

    setExtendLoading(true);
    try {
      const res = await fetch("/api/booking/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: extendingRes.id,
          extensionType,
          additionalHours: extensionType === "hours" ? Number(additionalHours) : null,
          requestedTimeLabel: extensionType === "hours" ? timeLabels[additionalHours] : null,
          newCheckOutDate: extensionType === "days" ? newCheckOutDate : null,
          notes: extensionNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit extension request.");

      toast.success("Booking time extension request sent to hotel administration!");
      setExtendingRes(null);
      setExtensionNotes("");
      setNewCheckOutDate("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit extension request.");
    } finally {
      setExtendLoading(false);
    }
  }

  useEffect(() => {
    void (async () => { await fetchReservations(false); })();

    // Handle redirect from payment gateways
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      const success = params.get("success");

      // GCash success redirect
      if (success === "true") {
        toast.success("Booking confirmed! Welcome to Grand Azure.");
        window.history.replaceState({}, "", window.location.pathname);
        setTimeout(() => fetchReservations(true), 1000);
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
              fetchReservations(true);
            }
          })
          .catch(() => {});
      }
    }

    const interval = setInterval(() => {
      fetchReservations(true);
    }, 15000);
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

  const cancelPaidAmt = Number(cancellingRes?.paid_amount ?? 0);
  const cancelDeductAmt = Math.round(cancelPaidAmt * 0.1 * 100) / 100;
  const cancelRefundAmt = Math.round((cancelPaidAmt - cancelDeductAmt) * 100) / 100;

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Reservations</h1>
          <p className="page-subtitle">Your upcoming and past stays at Grand Azure.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchReservations(false)} variant="outline" size="sm" className="rounded-xl">
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
                    {Number(r.paid_amount ?? 0) > 0 && (
                      <div>Paid: <span className="text-emerald-600 font-semibold">{formatCurrency(r.paid_amount)}</span></div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-border/40 mt-4">
                  <Link href={`/guest/invoices?reservationId=${r.id}`}>
                    <Button variant="outline" size="sm" className="rounded-lg text-xs h-8 gap-1.5">
                      <Eye className="h-3 w-3" /> View Invoice
                    </Button>
                  </Link>

                  <div className="flex items-center gap-2">
                    {["confirmed", "checked_in"].includes(r.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExtendingRes(r);
                          setExtensionType("hours");
                          setAdditionalHours("3");
                          setNewCheckOutDate(r.check_out_date ?? "");
                          setExtensionNotes("");
                        }}
                        className="rounded-lg text-xs h-8 gap-1.5 text-amber-700 hover:bg-amber-50 border-amber-200 dark:text-amber-400 dark:border-amber-800/50 dark:hover:bg-amber-950/20"
                      >
                        <Clock className="h-3.5 w-3.5" /> Extend Time
                      </Button>
                    )}
                    {["pending", "confirmed"].includes(r.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancellingRes(r)}
                        className="rounded-lg text-xs h-8 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel Booking
                      </Button>
                    )}
                  </div>
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

      {/* Cancellation Confirmation Modal */}
      {cancellingRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-charcoal-900 border border-border/40 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display">Cancel Reservation</h3>
                <p className="text-xs text-muted-foreground">
                  Confirmation: <span className="font-mono font-semibold text-foreground">{cancellingRes.confirmation_number ?? cancellingRes.id.slice(0, 8)}</span>
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
              <p className="font-semibold">Cancellation &amp; Refund Policy (10% Fee Deduction)</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                {cancellingRes.room_types?.name ?? "Room"} &bull; {cancellingRes.check_in_date} to {cancellingRes.check_out_date}
              </p>

              {cancelPaidAmt > 0 ? (
                <div className="pt-2 mt-2 border-t border-amber-200/80 dark:border-amber-800/40 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Original Amount Paid:</span>
                    <span className="font-semibold">{formatCurrency(cancelPaidAmt)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>Cancellation Deduction (10%):</span>
                    <span className="font-semibold">-{formatCurrency(cancelDeductAmt)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400 pt-1 border-t border-amber-200/60">
                    <span>Total Amount to be Refunded (90%):</span>
                    <span>{formatCurrency(cancelRefundAmt)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] opacity-80 pt-1">
                  No online payment was collected for this booking (Pay at Hotel). No refund charge applies.
                </p>
              )}

              <p className="text-[11px] opacity-80 pt-1">
                A confirmation email with your cancellation and refund details will be sent to your email address.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Reason for cancellation (optional)</label>
              <input
                type="text"
                placeholder="e.g., Change of travel dates, personal emergency"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => { setCancellingRes(null); setCancelReason(""); }}
                disabled={cancelLoading}
              >
                Keep Booking
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white border-transparent"
                onClick={handleConfirmCancel}
                loading={cancelLoading}
              >
                Yes, Cancel Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Time Extension Modal */}
      {extendingRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-charcoal-900 border border-border/40 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display">Extend Booking Time</h3>
                <p className="text-xs text-muted-foreground">
                  {extendingRes.confirmation_number ?? extendingRes.id.slice(0, 8)} &bull; Current Check-Out: {extendingRes.check_out_date}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmExtend} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExtensionType("hours")}
                  className={`p-2.5 text-xs font-semibold rounded-xl border transition-all ${
                    extensionType === "hours"
                      ? "bg-navy-800 text-white border-navy-800"
                      : "border-border/60 text-muted-foreground"
                  }`}
                >
                  Late Check-Out (Hours)
                </button>
                <button
                  type="button"
                  onClick={() => setExtensionType("days")}
                  className={`p-2.5 text-xs font-semibold rounded-xl border transition-all ${
                    extensionType === "days"
                      ? "bg-navy-800 text-white border-navy-800"
                      : "border-border/60 text-muted-foreground"
                  }`}
                >
                  Extend Stay (Dates)
                </button>
              </div>

              {extensionType === "hours" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Requested Check-Out Extension</Label>
                  <select
                    value={additionalHours}
                    onChange={(e) => setAdditionalHours(e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none"
                  >
                    <option value="2">+2 Hours (Until 2:00 PM)</option>
                    <option value="3">+3 Hours (Until 3:00 PM)</option>
                    <option value="6">+6 Hours (Until 6:00 PM)</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">New Check-Out Date</Label>
                  <Input
                    type="date"
                    min={extendingRes.check_out_date}
                    value={newCheckOutDate}
                    onChange={(e) => setNewCheckOutDate(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                <Input
                  placeholder="e.g., Late flight schedule"
                  value={extensionNotes}
                  onChange={(e) => setExtensionNotes(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => setExtendingRes(null)}
                  disabled={extendLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  className="flex-1 rounded-xl"
                  loading={extendLoading}
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
