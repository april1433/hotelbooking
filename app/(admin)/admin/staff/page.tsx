"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { Search, Plus, UserCog, RefreshCw, Eye, Edit, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS } from "@/constants";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StaffMember = Record<string, any>;

const STAFF_ROLES = ["all", "super_admin", "manager", "receptionist", "housekeeping", "maintenance", "cashier"];
const ASSIGNABLE_ROLES = ["manager", "receptionist", "housekeeping", "maintenance", "cashier"];

const ROLE_BADGE_COLORS: Record<string, string> = {
  super_admin:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  manager:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  receptionist:  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  housekeeping:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  maintenance:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  cashier:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const FIELD_CLASS = "w-full h-9 rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/40";

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("receptionist");

  async function fetchStaff() {
    setLoading(true);
    const supabase = createClient() as any;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .not("role", "eq", "guest")
      .order("role", { ascending: true });
    setStaff(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchStaff(); }, []);

  function openAddModal() {
    setEditingStaff(null);
    setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setPhone(""); setRole("receptionist");
    setShowModal(true);
  }

  function openEditModal(s: StaffMember) {
    setEditingStaff(s);
    setFirstName(s.first_name ?? ""); setLastName(s.last_name ?? ""); setEmail(s.email ?? "");
    setPassword(""); setPhone(s.phone ?? ""); setRole(s.role ?? "receptionist");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !email) { toast.error("Please fill in First Name, Last Name, and Email."); return; }
    if (!editingStaff && !password) { toast.error("Password is required for new staff accounts."); return; }

    setSubmitting(true);
    try {
      if (editingStaff) {
        // Update existing profile
        const supabase = createClient() as any;
        const { error } = await supabase
          .from("profiles")
          .update({ first_name: firstName, last_name: lastName, phone: phone || null, role })
          .eq("id", editingStaff.id);
        if (error) throw error;
        toast.success("Staff member updated successfully.");
      } else {
        // Create via API route to use service-role key for auth
        const res = await fetch("/api/staff/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName, email, password, phone, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create staff account.");
        toast.success("Staff account created successfully.");
      }
      setShowModal(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = staff.filter(s => {
    const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.toLowerCase();
    const emailVal = (s.email ?? "").toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || emailVal.includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Manage hotel staff accounts and role assignments.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchStaff} variant="outline" size="sm" className="rounded-xl">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={openAddModal} variant="gold" size="sm" className="rounded-xl">
            <Plus className="h-3.5 w-3.5 mr-2" /> Add Staff
          </Button>
        </div>
      </div>

      {/* Summary by role */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAFF_ROLES.filter(r => r !== "all").map(role => (
          <Card key={role} className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}>
            <CardContent className="p-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{ROLE_LABELS[role]}</p>
              <p className="text-xl font-bold">{loading ? "—" : staff.filter(s => s.role === role).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            className="pl-9 h-9 rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STAFF_ROLES.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${roleFilter === r ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}>
              {r === "all" ? "All Roles" : ROLE_LABELS[r]}
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

      {/* Empty state */}
      {!loading && staff.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <UserCog className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Staff Members Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Add staff accounts and assign roles to get started.</p>
            </div>
            <Button onClick={openAddModal} variant="gold" size="sm" className="rounded-xl mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add First Staff Member
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && staff.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="px-4 py-3 text-left">Staff Member</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Added</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-muted/20 border-b border-border/30 last:border-0">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {(s.first_name?.[0] ?? "?")}
                          </div>
                          <span className="font-medium">{s.first_name} {s.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{s.email ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_COLORS[s.role] ?? "bg-gray-100 text-gray-700"}`}>
                          {ROLE_LABELS[s.role] ?? s.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm">{s.phone ?? "—"}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditModal(s)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">No staff match your search or filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md border border-border/60">
            <div className="flex items-center justify-between p-6 border-b border-border/40">
              <div>
                <h2 className="text-lg font-semibold font-display">{editingStaff ? "Edit Staff Member" : "Add New Staff"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{editingStaff ? "Update role and contact details." : "Create a new staff account with login credentials."}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">First Name *</label>
                  <input className={FIELD_CLASS} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Last Name *</label>
                  <input className={FIELD_CLASS} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="dela Cruz" required />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Address *</label>
                <input type="email" className={`${FIELD_CLASS} ${editingStaff ? "opacity-60 cursor-not-allowed" : ""}`}
                  value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@hotel.com"
                  disabled={!!editingStaff} required />
                {editingStaff && <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed after account creation.</p>}
              </div>

              {!editingStaff && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password *</label>
                  <input type="password" className={FIELD_CLASS} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters" minLength={8} required />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                <input className={FIELD_CLASS} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+63 9171234567" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role *</label>
                <select className={FIELD_CLASS} value={role} onChange={e => setRole(e.target.value)} required>
                  {ASSIGNABLE_ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" size="sm" className="flex-1 rounded-xl" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Saving…</> : editingStaff ? "Save Changes" : "Create Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
