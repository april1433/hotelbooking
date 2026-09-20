"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatusBadge, Button } from "@/components/ui";
import { History, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CleaningLog = Record<string, any>;

export default function HousekeepingLogsPage() {
  const [logs, setLogs] = useState<CleaningLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLogs() {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data } = await supabase
        .from("housekeeping_logs")
        .select("*, rooms(room_number), profiles(first_name, last_name)")
        .order("created_at", { ascending: false });
      setLogs(data ?? []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <History className="h-7 w-7 text-muted-foreground" /> Cleaning Log History
          </h1>
          <p className="page-subtitle">View past room cleaning records and inspections.</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm" className="rounded-xl border-border/80">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!loading && logs.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <History className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Logs Recorded</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Room cleaning activity will be logged here once housekeepers update room status.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">Recent Activity Log</CardTitle>
            <CardDescription>Log history of completed cleanings and inspections.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t border-border/40">
            <div className="divide-y divide-border/40">
              {logs.map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-muted/10">
                  <div>
                    <p className="text-sm font-semibold">Room {log.rooms?.room_number ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      Housekeeper: {log.profiles?.first_name} {log.profiles?.last_name} · Action: {log.action ?? log.notes ?? "Cleaning status change"}
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
    </div>
  );
}
