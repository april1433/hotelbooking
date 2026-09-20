"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatusBadge, Button } from "@/components/ui";
import { Clock, CheckSquare, Sparkles, ClipboardList, RefreshCw, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HousekeepingTask = Record<string, any>;

export default function HousekeepingStaffDashboard() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchTasks() {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data } = await supabase
        .from("rooms")
        .select("id, room_number, cleaning_status, status, room_types(name)")
        .order("room_number");
      setTasks(data ?? []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTasks(); }, []);

  const updateStatus = async (roomId: string, newStatus: string) => {
    const supabase = createClient();
    try {
      await supabase
        .from("rooms")
        .update({ cleaning_status: newStatus } as any)
        .eq("id", roomId);
      
      // Update local state
      setTasks(prev => prev.map(t => t.id === roomId ? { ...t, cleaning_status: newStatus } : t));
    } catch {
      // Ignored
    }
  };

  const counts = {
    pending: tasks.filter(t => t.cleaning_status === "dirty").length,
    active: tasks.filter(t => t.cleaning_status === "in_progress").length,
    completed: tasks.filter(t => t.cleaning_status === "clean" || t.cleaning_status === "inspected").length,
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-muted-foreground" /> Housekeeper Workspace
          </h1>
          <p className="page-subtitle">Manage your assigned cleanings and room inspections.</p>
        </div>
        <Button onClick={fetchTasks} variant="outline" size="sm" className="rounded-xl border-border/80">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh Queue
        </Button>
      </div>

      {/* Performance counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending Cleaning", value: counts.pending, color: "text-red-500 bg-red-50 dark:bg-red-950/30" },
          { label: "Active Cleanings", value: counts.active, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
          { label: "Completed Rooms", value: counts.completed, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
        ].map((s, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">{s.label}</p>
              <p className={`text-2xl font-bold rounded-lg px-2.5 py-1 w-fit ${s.color}`}>{loading ? "—" : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && tasks.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Rooms Assigned</h3>
              <p className="text-sm text-muted-foreground mt-1">There are no rooms in the database currently.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Queue List */}
      {!loading && tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" /> My Assigned Rooms
            </CardTitle>
            <CardDescription>Click to change status as you perform cleaning tasks.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t border-border/40">
            <div className="divide-y divide-border/40">
              {tasks.map(task => (
                <div key={task.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/10 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl font-bold font-display">Room {task.room_number}</span>
                      <span className="text-xs text-muted-foreground">{task.room_types?.name ?? "Room"}</span>
                      <StatusBadge status={task.cleaning_status ?? "dirty"} />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">Room Status: <span className="capitalize">{task.status}</span></p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {(task.cleaning_status === "dirty" || !task.cleaning_status) && (
                      <Button
                        variant="navy"
                        size="sm"
                        className="rounded-lg text-xs h-8 gap-1.5"
                        onClick={() => updateStatus(task.id, "in_progress")}
                      >
                        <Clock className="h-3.5 w-3.5" /> Start Cleaning
                      </Button>
                    )}
                    {task.cleaning_status === "in_progress" && (
                      <Button
                        variant="gold"
                        size="sm"
                        className="rounded-lg text-xs h-8 gap-1.5"
                        onClick={() => updateStatus(task.id, "clean")}
                      >
                        <CheckSquare className="h-3.5 w-3.5" /> Mark Clean
                      </Button>
                    )}
                    {(task.cleaning_status === "clean" || task.cleaning_status === "inspected") && (
                      <span className="inline-flex items-center rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        ✓ Clean &amp; Ready
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs h-8 text-red-500 border-red-200/40 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Report Issue
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
