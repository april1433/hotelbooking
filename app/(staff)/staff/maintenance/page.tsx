"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, StatusBadge, Button } from "@/components/ui";
import { Wrench, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ticket = Record<string, any>;

export default function MaintenanceStaffConsole() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchTickets() {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data } = await supabase
        .from("maintenance_requests")
        .select("*, rooms(room_number)")
        .order("created_at", { ascending: false });
      setTickets(data ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTickets(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const supabase = createClient();
    try {
      await supabase
        .from("maintenance_requests")
        .update({ status: newStatus } as any)
        .eq("id", id);
      
      // Update local state
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch {
      // Ignored
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <Wrench className="h-7 w-7 text-muted-foreground" /> Maintenance Console
          </h1>
          <p className="page-subtitle">Track and update your assigned repair and service tasks.</p>
        </div>
        <Button onClick={fetchTickets} variant="outline" size="sm" className="rounded-xl border-border/80">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && tickets.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Wrench className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Maintenance Tasks</h3>
              <p className="text-sm text-muted-foreground mt-1">There are no reported maintenance tickets currently.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets Queue */}
      {!loading && tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <Card key={ticket.id} className={ticket.status === "resolved" ? "opacity-75 bg-muted/20" : ""}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  {/* Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-mono">{ticket.id.slice(0, 8)}</span>
                      <h3 className="font-semibold text-base">Room {ticket.rooms?.room_number ?? "General"}</h3>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="text-sm text-foreground font-medium leading-relaxed">{ticket.title ?? ticket.description}</p>
                    {ticket.description && ticket.title && (
                      <p className="text-xs text-muted-foreground">{ticket.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-muted-foreground pt-1">
                      <div>
                        <span className="block font-medium">Category</span>
                        <span className="text-foreground capitalize">{ticket.category ?? "General"}</span>
                      </div>
                      <div>
                        <span className="block font-medium">Priority</span>
                        <span className={`font-semibold capitalize ${ticket.priority === "critical" ? "text-red-500" : "text-amber-600"}`}>
                          {ticket.priority ?? "low"}
                        </span>
                      </div>
                      <div>
                        <span className="block font-medium">Reported</span>
                        <span className="text-foreground">{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2.5 shrink-0 self-end md:self-center">
                    {ticket.status === "open" && (
                      <Button
                        variant="navy"
                        size="sm"
                        className="rounded-lg text-xs h-8 gap-1.5"
                        onClick={() => updateStatus(ticket.id, "in_progress")}
                      >
                        <Clock className="h-3.5 w-3.5" /> Start Work
                      </Button>
                    )}
                    {ticket.status === "in_progress" && (
                      <Button
                        variant="gold"
                        size="sm"
                        className="rounded-lg text-xs h-8 gap-1.5"
                        onClick={() => updateStatus(ticket.id, "resolved")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolve Ticket
                      </Button>
                    )}
                    {ticket.status === "resolved" && (
                      <span className="inline-flex items-center rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        ✓ Repair Completed
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
