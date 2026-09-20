"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatusBadge, Button } from "@/components/ui";
import { Clock, CheckSquare, Sparkles, ClipboardList, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Room = Record<string, any>;

export default function HousekeepingTasksPage() {
  const [tasks, setTasks] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchTasks() {
    setLoading(true);
    const supabase = createClient();
    try {
      // Query rooms that are either dirty or currently in cleaning progress
      const { data } = await supabase
        .from("rooms")
        .select("id, room_number, cleaning_status, status, room_types(name)")
        .in("cleaning_status", ["dirty", "in_progress"])
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
      setTasks(prev => prev.filter(t => t.id !== roomId));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-muted-foreground" /> My Cleaning Tasks
          </h1>
          <p className="page-subtitle">Your active cleaning queue. Complete dirty rooms to prepare them for check-ins.</p>
        </div>
        <Button onClick={fetchTasks} variant="outline" size="sm" className="rounded-xl border-border/80">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">All Rooms Cleaned!</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                No rooms currently require cleaning. Check the main queue for room status verification.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" /> Active Cleanings Needed
            </CardTitle>
            <CardDescription>Click to start or complete your cleaning task.</CardDescription>
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
                    <p className="text-[10px] text-muted-foreground font-mono">Status: <span className="capitalize">{task.status}</span></p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {task.cleaning_status === "dirty" && (
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
