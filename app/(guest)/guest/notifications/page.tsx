"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, Button } from "@/components/ui";
import { Bell, BellOff, CheckCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Notification = Record<string, any>;

export default function GuestNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  async function fetchNotifications() {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setNotifications(data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNotifications(); }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    const supabase = createClient() as any;
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true } as any)
        .eq("user_id", user?.id as string)
        .eq("is_read", false);
    } catch {
      // Ignore
    }
  };

  const filtered = notifications.filter(n => filter === "all" || !n.is_read);

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated on your stays, payments, and special rewards.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchNotifications} variant="outline" size="sm" className="rounded-xl mr-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="rounded-xl border-border/80" onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5 mr-2" /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm rounded-xl font-medium transition-all ${filter === "all" ? "bg-navy-800 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 text-sm rounded-xl font-medium transition-all ${filter === "unread" ? "bg-navy-800 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Notification List */}
      {!loading && (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-card">
              <BellOff className="h-8 w-8 mb-3 opacity-30" />
              <p className="text-sm font-medium">No alerts to show</p>
            </div>
          ) : (
            filtered.map(n => (
              <Card key={n.id} className={`transition-all duration-300 ${!n.is_read ? "border-navy-200/60 dark:border-navy-800/40 bg-navy-50/20 dark:bg-navy-950/10" : ""}`}>
                <CardContent className="p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted shrink-0">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold text-sm ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</h3>
                          {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
