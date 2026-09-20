"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, StatusBadge, Button, Input } from "@/components/ui";
import { Search, Sparkles, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HousekeepingLog = Record<string, any>;

const CLEANING_STATUSES = ["all", "dirty", "in_progress", "clean", "inspected", "do_not_disturb"];

export default function HousekeepingPage() {
  const [logs, setLogs] = useState<HousekeepingLog[]>([]);
  const [rooms, setRooms] = useState<HousekeepingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function fetchData() {
    setLoading(true);
    const supabase = createClient();
    const [roomsRes, logsRes] = await Promise.all([
      supabase.from("rooms").select("id, room_number, cleaning_status, floor_number, room_types(name)").order("room_number"),
      supabase.from("housekeeping_logs").select("*, rooms(room_number), profiles(first_name, last_name)").order("created_at", { ascending: false }).limit(20),
    ]);
    setRooms(roomsRes.data ?? []);
    setLogs(logsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const filteredRooms = rooms.filter(r => {
    const num = String(r.room_number ?? "").includes(search);
    const typeName = (r.room_types?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchSearch = num || typeName;
    const matchStatus = statusFilter === "all" || r.cleaning_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    dirty: rooms.filter(r => r.cleaning_status === "dirty").length,
    inProgress: rooms.filter(r => r.cleaning_status === "in_progress").length,
    clean: rooms.filter(r => r.cleaning_status === "clean" || r.cleaning_status === "inspected").length,
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Housekeeping</h1>
          <p className="page-subtitle">Monitor room cleaning status and manage housekeeping tasks.</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="rounded-xl">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Rooms", value: loading ? "—" : rooms.length, color: "text-foreground" },
          { label: "Needs Cleaning", value: loading ? "—" : counts.dirty, color: "text-red-500" },
          { label: "In Progress", value: loading ? "—" : counts.inProgress, color: "text-amber-500" },
          { label: "Clean / Ready", value: loading ? "—" : counts.clean, color: "text-emerald-600" },
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
          <Input placeholder="Search room…" className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CLEANING_STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${statusFilter === s ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && rooms.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Rooms to Track</h3>
              <p className="text-sm text-muted-foreground mt-1">Add rooms in Rooms Management to start tracking cleaning status.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Grid */}
      {!loading && rooms.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {filteredRooms.map(room => {
              const status = room.cleaning_status ?? "unknown";
              const statusColors: Record<string, string> = {
                clean:          "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20",
                inspected:      "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
                dirty:          "border-red-300 bg-red-50 dark:bg-red-950/20",
                in_progress:    "border-amber-300 bg-amber-50 dark:bg-amber-950/20",
                do_not_disturb: "border-purple-300 bg-purple-50 dark:bg-purple-950/20",
              };
              return (
                <div key={room.id} className={`rounded-xl border-2 p-3 transition-all hover:shadow-md ${statusColors[status] ?? "border-border bg-card"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-lg font-display">{room.room_number}</span>
                    {status === "clean" || status === "inspected"
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <Clock className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                  <p className="text-[10px] text-muted-foreground">{room.room_types?.name ?? "Room"}</p>
                  <div className="mt-2">
                    <StatusBadge status={status} />
                  </div>
                </div>
              );
            })}
            {filteredRooms.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground text-sm">No rooms match your filter.</div>
            )}
          </div>

          {/* Recent Logs */}
          {logs.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="px-5 py-4 border-b border-border/40">
                  <h3 className="font-semibold">Recent Cleaning Logs</h3>
                </div>
                <div className="divide-y divide-border/30">
                  {logs.slice(0, 10).map(log => (
                    <div key={log.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/20">
                      <div>
                        <p className="text-sm font-medium">Room {log.rooms?.room_number ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.profiles?.first_name} {log.profiles?.last_name} · {log.action ?? log.notes ?? "Cleaning activity"}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={log.status ?? "clean"} />
                        <p className="text-[10px] text-muted-foreground mt-1">{log.created_at ? new Date(log.created_at).toLocaleString() : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
