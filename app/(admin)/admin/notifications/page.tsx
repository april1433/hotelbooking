"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from "@/components/ui";
import { Bell, CheckCheck, RefreshCw, Send, Pencil, Trash2, X, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Notification = Record<string, any>;

const FIELD_CLASS = "w-full h-9 rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/40 text-foreground";

const NOTIF_TYPES = [
  { value: "system", label: "System" },
  { value: "promotion", label: "Promotion / Offer" },
  { value: "booking_confirmation", label: "Booking Confirmation" },
  { value: "booking_reminder", label: "Booking Reminder" },
  { value: "booking_cancellation", label: "Booking Cancellation" },
  { value: "payment_received", label: "Payment Received" },
  { value: "payment_reminder", label: "Payment Reminder" },
  { value: "checkout_reminder", label: "Checkout Reminder" },
  { value: "maintenance_update", label: "Maintenance Update" },
  { value: "housekeeping_update", label: "Housekeeping Update" },
  { value: "review_request", label: "Review Request" },
  { value: "inventory_alert", label: "Inventory Alert" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Broadcast form states
  const [selectedUser, setSelectedUser] = useState("all_guests");
  const [notifType, setNotifType] = useState("system");
  const [titleInput, setTitleInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  // Edit modal states
  const [editingNotif, setEditingNotif] = useState<Notification | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchNotifications() {
    setLoading(true);
    const supabase = createClient() as any;
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      setNotifications(data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfiles() {
    const supabase = createClient() as any;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, role")
        .order("first_name", { ascending: true });
      setProfiles(data ?? []);
    } catch (err) {
      console.error("Failed to load profiles:", err);
    }
  }

  useEffect(() => {
    fetchNotifications();
    fetchProfiles();
  }, []);

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    const supabase = createClient() as any;
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true } as any)
        .eq("is_read", false);
      toast.success("All notifications marked as read.");
    } catch {
      // Ignored
    }
  };

  // ── Broadcast send ──────────────────────────────────────────────────
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !messageInput.trim()) {
      toast.error("Please enter a title and message.");
      return;
    }
    setSending(true);
    const supabase = createClient() as any;
    try {
      let targets: string[] = [];
      if (selectedUser === "all_guests") {
        targets = profiles.filter(p => p.role === "guest").map(p => p.id);
      } else if (selectedUser === "all_staff") {
        targets = profiles.filter(p => p.role !== "guest").map(p => p.id);
      } else {
        targets = [selectedUser];
      }

      if (targets.length === 0) {
        toast.error("No recipient profiles found for selected group.");
        setSending(false);
        return;
      }

      const rows = targets.map(uid => ({
        user_id: uid,
        title: titleInput.trim(),
        message: messageInput.trim(),
        type: notifType,
        is_read: false,
      }));

      const { error } = await supabase.from("notifications").insert(rows);
      if (error) throw error;

      toast.success(`Successfully sent alert to ${targets.length} user(s).`);
      setTitleInput("");
      setMessageInput("");
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.message || "Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────
  const openEdit = (n: Notification) => {
    setEditingNotif(n);
    setEditTitle(n.title ?? "");
    setEditMessage(n.message ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editingNotif) return;
    if (!editTitle.trim() || !editMessage.trim()) {
      toast.error("Title and message cannot be empty.");
      return;
    }
    setEditSaving(true);
    const supabase = createClient() as any;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ title: editTitle.trim(), message: editMessage.trim() } as any)
        .eq("id", editingNotif.id);
      if (error) throw error;
      toast.success("Notification updated.");
      setNotifications(prev =>
        prev.map(n =>
          n.id === editingNotif.id ? { ...n, title: editTitle.trim(), message: editMessage.trim() } : n
        )
      );
      setEditingNotif(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update notification.");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient() as any;
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete notification.");
    } finally {
      setDeletingId(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-8 page-transition">
      {/* ── Edit Modal ── */}
      {editingNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold flex items-center gap-2">
                <Pencil className="h-4 w-4 text-gold-500" /> Edit Notification
              </h2>
              <button
                onClick={() => setEditingNotif(null)}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Title</Label>
              <Input
                className="rounded-xl h-9 text-foreground"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Message</Label>
              <textarea
                className="w-full min-h-[90px] p-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500/40"
                value={editMessage}
                onChange={e => setEditMessage(e.target.value)}
              />
            </div>

            <p className="text-[10px] text-muted-foreground">
              ⚠️ This will update the notification for all recipients it was sent to.
            </p>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditingNotif(null)}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1 rounded-xl" onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? "Saving..." : <><Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">System alerts, operation updates, and custom broadcasts.</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {unreadCount} unread
            </span>
          )}
          <Button variant="outline" size="sm" className="rounded-xl border-border/80 text-xs h-8" onClick={fetchNotifications}>
            <RefreshCw className="h-3 w-3 mr-1.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl border-border/80 text-xs h-8" onClick={markAllRead} disabled={notifications.length === 0}>
            <CheckCheck className="h-3.5 w-3.5 mr-2" /> Mark All Read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Notification Feed ── */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display text-base font-semibold">Alert History</h2>

          {loading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <Card className="border-dashed border-2">
              <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-3">
                <Bell className="h-8 w-8 text-muted-foreground opacity-30" />
                <div>
                  <h3 className="font-semibold text-base">All Quiet Here</h3>
                  <p className="text-xs text-muted-foreground mt-1">No alerts or operation updates have been logged yet.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && notifications.length > 0 && (
            <div className="space-y-3">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-4 p-4 rounded-xl border transition-all group ${
                    !n.is_read
                      ? "bg-navy-50/50 border-navy-200 dark:bg-navy-950/20 dark:border-navy-800"
                      : "bg-card border-border/40"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted shrink-0 text-muted-foreground">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                            {n.title}
                          </p>
                          {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded-md capitalize">
                            {(n.type ?? "system").replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons — visible on hover */}
                      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(n)}
                          title="Edit notification"
                          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted border border-transparent hover:border-border/60 transition-all text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          disabled={deletingId === n.id}
                          title="Delete notification"
                          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all text-muted-foreground hover:text-red-500 disabled:opacity-40"
                        >
                          {deletingId === n.id ? (
                            <span className="h-3 w-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Broadcast Form ── */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Send className="h-4 w-4 text-gold-600" /> Broadcast Alert
              </CardTitle>
              <CardDescription>Send an instant notification to guests or staff consoles.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Recipient Group</Label>
                  <select
                    className={FIELD_CLASS}
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                  >
                    <option value="all_guests">All Registered Guests</option>
                    <option value="all_staff">All Staff Members</option>
                    <optgroup label="Individual Profiles">
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} ({p.role})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Notification Type</Label>
                  <select
                    className={FIELD_CLASS}
                    value={notifType}
                    onChange={e => setNotifType(e.target.value)}
                  >
                    {NOTIF_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Alert Title</Label>
                  <Input
                    className="rounded-xl h-9 text-foreground"
                    placeholder="e.g. Free Breakfast Voucher"
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Alert Message</Label>
                  <textarea
                    className="w-full min-h-[80px] p-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500/40"
                    placeholder="Explain the update, instructions, or discount code here..."
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" variant="gold" className="w-full rounded-xl" disabled={sending}>
                  {sending ? "Sending..." : <><Send className="h-3.5 w-3.5 mr-2" /> Send Notification</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
