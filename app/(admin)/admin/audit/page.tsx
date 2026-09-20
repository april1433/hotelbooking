"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { Search, ShieldCheck, Eye, LogIn, LogOut, Settings, Edit, Trash2, UserPlus, CreditCard, Download, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuditLog = Record<string, any>;

const SEVERITY_STYLES: Record<string, { class: string; label: string }> = {
  info:    { class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Info" },
  success: { class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Success" },
  warning: { class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Warning" },
  danger:  { class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Critical" },
};

const ACTION_ICON: Record<string, React.FC<{ className?: string }>> = {
  LOGIN:              LogIn,
  LOGOUT:             LogOut,
  CREATE_STAFF:       UserPlus,
  PROCESS_PAYMENT:    CreditCard,
  UPDATE_RESERVATION: Edit,
  DELETE_RESERVATION: Trash2,
  EXPORT_REPORT:      Download,
  FAILED_LOGIN:       ShieldCheck,
  UPDATE_SETTINGS:    Settings,
  CHECK_IN:           LogIn,
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  async function fetchLogs() {
    setLoading(true);
    const supabase = createClient();
    try {
      // In case audit_logs table exists or is created later
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });
      setLogs(data ?? []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(l => {
    const matchSearch = 
      (l.user ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.action ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.details ?? "").toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "all" || l.severity === severityFilter;
    return matchSearch && matchSeverity;
  });

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-muted-foreground" /> Audit Logs
          </h1>
          <p className="page-subtitle">Immutable trail of all system actions and access events.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLogs} variant="outline" size="sm" className="rounded-xl">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl border-border/80">
            <Download className="h-3.5 w-3.5 mr-2" /> Export Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Events",     value: loading ? "—" : logs.length, color: "text-foreground" },
          { label: "Warnings",         value: loading ? "—" : logs.filter(l => l.severity === "warning").length, color: "text-amber-600" },
          { label: "Critical Actions", value: loading ? "—" : logs.filter(l => l.severity === "danger").length, color: "text-red-500" },
          { label: "Failed Logins",    value: loading ? "—" : logs.filter(l => l.action === "FAILED_LOGIN").length, color: "text-rose-500" },
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
          <Input placeholder="Search user, action, details…" className="pl-9 h-9 rounded-xl"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "info", "success", "warning", "danger"].map(s => (
            <button key={s} onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${severityFilter === s ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}>
              {s === "all" ? "All" : SEVERITY_STYLES[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Audit Logs</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The audit trail is currently empty. Actions will be logged once users interact with the system.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Table */}
      {!loading && logs.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left">Timestamp</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Resource</th>
                    <th className="px-4 py-3 text-left">Details</th>
                    <th className="px-4 py-3 text-left">IP Address</th>
                    <th className="px-4 py-3 text-left">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => {
                    const Icon = ACTION_ICON[l.action] || Eye;
                    return (
                      <tr key={l.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {l.created_at ? new Date(l.created_at).toLocaleString() : l.timestamp}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium">{l.user}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground capitalize">{(l.role ?? "").replace("_", " ")}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs font-mono bg-muted/50 rounded-lg px-2 py-1 w-fit">
                            <Icon className="h-3 w-3 text-muted-foreground" />
                            {l.action}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{l.resource}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-xs">
                          <span className="line-clamp-2">{l.details}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">{l.ip}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLES[l.severity]?.class}`}>
                            {SEVERITY_STYLES[l.severity]?.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">No audit logs found.</td></tr>
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
