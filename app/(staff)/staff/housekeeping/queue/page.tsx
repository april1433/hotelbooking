"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatusBadge, Button, Input } from "@/components/ui";
import { Search, Sparkles, RefreshCw, CheckSquare, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Room = Record<string, any>;

export default function CleaningQueuePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function fetchRooms() {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data } = await supabase
        .from("rooms")
        .select("id, room_number, cleaning_status, status, room_types(name)")
        .order("room_number");
      setRooms(data ?? []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRooms(); }, []);

  const updateStatus = async (roomId: string, newStatus: string) => {
    const supabase = createClient();
    try {
      await supabase
        .from("rooms")
        .update({ cleaning_status: newStatus } as any)
        .eq("id", roomId);
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, cleaning_status: newStatus } : r));
    } catch {
      // Ignore
    }
  };

  const filtered = rooms.filter(r => {
    const num = String(r.room_number ?? "").includes(search);
    const typeName = (r.room_types?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchSearch = num || typeName;
    const matchStatus = statusFilter === "all" || r.cleaning_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-muted-foreground" /> Cleaning Queue
          </h1>
          <p className="page-subtitle">Overview of cleaning requirements across all hotel rooms.</p>
        </div>
        <Button onClick={fetchRooms} variant="outline" size="sm" className="rounded-xl border-border/80">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search room…" className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "dirty", "in_progress", "clean", "inspected", "do_not_disturb"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${statusFilter === s ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 opacity-30" />
            No rooms found in queue.
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="px-4 py-3 text-left">Room</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Room Status</th>
                    <th className="px-4 py-3 text-left">Cleaning Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(room => (
                    <tr key={room.id} className="hover:bg-muted/20 border-b border-border/30 last:border-0">
                      <td className="px-4 py-3.5 font-bold">Room {room.room_number}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{room.room_types?.name ?? "Room"}</td>
                      <td className="px-4 py-3.5 text-sm capitalize">{room.status}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={room.cleaning_status ?? "dirty"} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          {(room.cleaning_status === "dirty" || !room.cleaning_status) && (
                            <Button variant="navy" size="sm" onClick={() => updateStatus(room.id, "in_progress")}>
                              <Clock className="h-3 w-3 mr-1" /> Start
                            </Button>
                          )}
                          {room.cleaning_status === "in_progress" && (
                            <Button variant="gold" size="sm" onClick={() => updateStatus(room.id, "clean")}>
                              <CheckSquare className="h-3 w-3 mr-1" /> Finish
                            </Button>
                          )}
                          {room.cleaning_status === "clean" && (
                            <Button variant="outline" size="sm" onClick={() => updateStatus(room.id, "inspected")}>
                              Inspect
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
