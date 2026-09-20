/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, Button, Input, Label } from "@/components/ui";
import { Search, Plus, Users, RefreshCw, Eye, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function GuestsPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modal and Creation States
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [vipStatus, setVipStatus] = useState(false);
  const [notes, setNotes] = useState("");

  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");

  async function fetchGuests() {
    setLoading(true);
    const supabase = createClient() as any;
    try {
      const { data } = await supabase
        .from("guests")
        .select("*, hotels(name)")
        .order("created_at", { ascending: false });
      setGuests(data ?? []);
    } catch (err) {
      console.error("Error fetching guests:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadHotels() {
    const supabase = createClient() as any;
    try {
      const { data } = await supabase.from("hotels").select("id, name").eq("is_active", true);
      setHotels(data ?? []);
      if (data && data.length > 0) {
        setSelectedHotelId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load hotels:", err);
    }
  }

  useEffect(() => {
    fetchGuests();
    loadHotels();
  }, []);

  const filtered = guests.filter(g => {
    const name = `${g.first_name ?? ""} ${g.last_name ?? ""}`.toLowerCase();
    const emailAddr = (g.email ?? "").toLowerCase();
    const phoneNum = (g.phone ?? "").toLowerCase();
    const hotelName = (g.hotels?.name ?? "").toLowerCase();
    return (
      name.includes(search.toLowerCase()) || 
      emailAddr.includes(search.toLowerCase()) || 
      phoneNum.includes(search.toLowerCase()) ||
      hotelName.includes(search.toLowerCase())
    );
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const openAddModal = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setNationality("");
    setVipStatus(false);
    setNotes("");
    if (hotels.length > 0) {
      setSelectedHotelId(hotels[0].id);
    }
    setShowModal(true);
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !selectedHotelId) {
      toast.error("Please fill in first name, last name, email, and hotel selection.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient() as any;
    try {
      const { error } = await supabase
        .from("guests")
        .insert({
          hotel_id: selectedHotelId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || null,
          nationality: nationality || null,
          vip_status: vipStatus,
          notes: notes || null,
        });

      if (error) throw error;

      toast.success("Guest record added successfully.");
      setShowModal(false);
      fetchGuests();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create guest record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Guest Directory</h1>
          <p className="page-subtitle">Manage and view all registered guests.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchGuests} variant="outline" size="sm" className="rounded-xl border-border/80">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={openAddModal} variant="gold" size="sm" className="rounded-xl">
            <Plus className="h-3.5 w-3.5 mr-2" /> Add Guest
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Guests", value: loading ? "—" : guests.length, color: "text-foreground" },
          { label: "Results Shown", value: loading ? "—" : filtered.length, color: "text-navy-600 dark:text-navy-400" },
          { label: "Page", value: loading ? "—" : `${page} / ${Math.max(1, totalPages)}`, color: "text-muted-foreground" },
        ].map((s, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone, or hotel…"
          className="pl-9 h-9 rounded-xl"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && guests.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Guests Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Guests will appear here once they register or are added manually.</p>
            </div>
            <Button onClick={openAddModal} variant="gold" size="sm" className="rounded-xl mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add First Guest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && guests.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="px-4 py-3 text-left">Guest</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Nationality</th>
                    <th className="px-4 py-3 text-center">VIP</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(g => (
                    <tr key={g.id} className="hover:bg-muted/20 border-b border-border/30 last:border-0">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 flex items-center justify-center text-xs font-bold shrink-0">
                            {(g.first_name?.[0] ?? "?")}
                          </div>
                          <div>
                            <span className="font-medium block">{g.first_name} {g.last_name}</span>
                            <span className="text-[10px] text-muted-foreground">{g.created_at ? new Date(g.created_at).toLocaleDateString() : ""}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{g.email ?? "—"}</td>
                      <td className="px-4 py-3.5 text-sm">{g.phone ?? "—"}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{g.hotels?.name ?? "—"}</td>
                      <td className="px-4 py-3.5 text-sm">{g.nationality ?? "—"}</td>
                      <td className="px-4 py-3.5 text-center">
                        {g.vip_status ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">VIP</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">No guests match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {filtered.length} guests</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg h-8 w-8 p-0" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg h-8 w-8 p-0" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Guest Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-charcoal-900 border border-border/40 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/40">
              <h3 className="font-semibold text-lg font-display text-foreground">Add New Guest</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddGuest} className="p-6 space-y-4">
              
              {/* Hotel Location select */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Home Hotel</Label>
                <select
                  value={selectedHotelId}
                  onChange={e => setSelectedHotelId(e.target.value)}
                  className="w-full h-10 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none"
                >
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* Name Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modalFirst" className="text-xs">First Name</Label>
                  <Input id="modalFirst" required placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} className="rounded-xl h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modalLast" className="text-xs">Last Name</Label>
                  <Input id="modalLast" required placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} className="rounded-xl h-10" />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modalEmail" className="text-xs">Email Address</Label>
                  <Input id="modalEmail" required type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modalPhone" className="text-xs">Phone Number</Label>
                  <Input id="modalPhone" placeholder="+63 917..." value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl h-10" />
                </div>
              </div>

              {/* Nationality & VIP */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <Label htmlFor="modalNat" className="text-xs">Nationality</Label>
                  <Input id="modalNat" placeholder="Filipino" value={nationality} onChange={e => setNationality(e.target.value)} className="rounded-xl h-10" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="modalVip"
                    checked={vipStatus}
                    onChange={e => setVipStatus(e.target.checked)}
                    className="w-4 h-4 rounded text-gold-500 border-border"
                  />
                  <Label htmlFor="modalVip" className="text-xs cursor-pointer select-none">Mark VIP Guest</Label>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="modalNotes" className="text-xs">Internal Notes</Label>
                <textarea
                  id="modalNotes"
                  placeholder="Preferences, allergy records..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full min-h-[70px] border border-input rounded-xl bg-background p-3 text-sm focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl h-10">
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={submitting} className="flex-1 rounded-xl h-10 flex items-center justify-center gap-1.5">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Guest"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
