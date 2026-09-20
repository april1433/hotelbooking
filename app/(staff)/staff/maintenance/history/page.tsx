"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatusBadge, Button } from "@/components/ui";
import { History, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ticket = Record<string, any>;

export default function MaintenanceHistoryPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchHistory() {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data } = await supabase
        .from("maintenance_requests")
        .select("*, rooms(room_number)")
        .in("status", ["resolved", "closed"])
        .order("updated_at", { ascending: false });
      setTickets(data ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchHistory(); }, []);

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <History className="h-7 w-7 text-muted-foreground" /> Ticket History
          </h1>
          <p className="page-subtitle">View resolved and completed maintenance jobs.</p>
        </div>
        <Button onClick={fetchHistory} variant="outline" size="sm" className="rounded-xl border-border/80">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <History className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Completed Tickets</h3>
              <p className="text-sm text-muted-foreground mt-1 font-light">
                No tickets have been resolved or closed yet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <Card key={ticket.id} className="opacity-75 bg-muted/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-center gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-mono">{ticket.id.slice(0, 8)}</span>
                      <h3 className="font-semibold text-base">Room {ticket.rooms?.room_number ?? "General"}</h3>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="text-sm text-foreground font-medium leading-relaxed">{ticket.title ?? ticket.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-muted-foreground pt-1">
                      <div>
                        <span className="block font-medium">Category</span>
                        <span className="text-foreground capitalize">{ticket.category ?? "General"}</span>
                      </div>
                      <div>
                        <span className="block font-medium">Priority</span>
                        <span className="text-foreground capitalize font-semibold">{ticket.priority ?? "low"}</span>
                      </div>
                      <div>
                        <span className="block font-medium">Completed Date</span>
                        <span className="text-foreground">{ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>
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
