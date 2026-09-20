"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, StatusBadge, Button, Input } from "@/components/ui";
import { Search, Plus, Wrench, RefreshCw, Eye, Edit } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ticket = Record<string, any>;

const PRIORITY_COLORS: Record<string, string> = {
  low:      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUSES = ["all", "open", "in_progress", "resolved", "closed", "deferred"];

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function fetchTickets() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("maintenance_requests")
      .select("*, rooms(room_number), profiles!reported_by(first_name, last_name), assigned:profiles!assigned_to(first_name, last_name)")
      .order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchTickets(); }, []);

  const filtered = tickets.filter(t => {
    const title = (t.title ?? t.description ?? "").toLowerCase();
    const room = String(t.rooms?.room_number ?? "").toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || room.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    critical: tickets.filter(t => t.priority === "critical").length,
    resolved: tickets.filter(t => t.status === "resolved" || t.status === "closed").length,
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">Track and manage all maintenance requests and work orders.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTickets} variant="outline" size="sm" className="rounded-xl">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="gold" size="sm" className="rounded-xl">
            <Plus className="h-3.5 w-3.5 mr-2" /> New Ticket
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Open Tickets",  value: loading ? "—" : counts.open,       color: "text-amber-500" },
          { label: "In Progress",   value: loading ? "—" : counts.inProgress,  color: "text-navy-600 dark:text-navy-400" },
          { label: "Critical",      value: loading ? "—" : counts.critical,    color: "text-red-500" },
          { label: "Resolved",      value: loading ? "—" : counts.resolved,    color: "text-emerald-600" },
        ].map((s, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets…" className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${statusFilter === s ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
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
              <h3 className="font-semibold text-lg">No Maintenance Tickets</h3>
              <p className="text-sm text-muted-foreground mt-1">No issues have been reported yet. Everything is running smoothly!</p>
            </div>
            <Button variant="gold" size="sm" className="rounded-xl mt-2">
              <Plus className="h-4 w-4 mr-2" /> Create Ticket
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ticket list */}
      {!loading && tickets.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="px-4 py-3 text-left">Issue</th>
                    <th className="px-4 py-3 text-left">Room</th>
                    <th className="px-4 py-3 text-left">Priority</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Reported By</th>
                    <th className="px-4 py-3 text-left">Assigned To</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-muted/20 border-b border-border/30 last:border-0">
                      <td className="px-4 py-3.5 font-medium max-w-xs truncate">{t.title ?? t.description ?? "Untitled"}</td>
                      <td className="px-4 py-3.5 text-sm">{t.rooms?.room_number ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[t.priority ?? "low"]}`}>
                          {(t.priority ?? "low").charAt(0).toUpperCase() + (t.priority ?? "low").slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{t.profiles?.first_name} {t.profiles?.last_name}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{t.assigned?.first_name ? `${t.assigned.first_name} ${t.assigned.last_name}` : "Unassigned"}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">No tickets match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
