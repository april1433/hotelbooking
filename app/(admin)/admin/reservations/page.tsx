/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatusBadge, Button, Input, Label } from "@/components/ui";
import { Search, Plus, CalendarDays, Download, Eye, RefreshCw, ChevronLeft, ChevronRight, X, Loader2, User, BedDouble } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DEFAULT_RESERVATIONS, DEFAULT_HOTEL, DEFAULT_ROOM_TYPES, DEFAULT_ROOMS } from "@/constants";

const STATUS_OPTIONS = ["all", "pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 8;

  // Modal and Creation states
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState("");

  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("pending");

  // Assign Room modal
  const [assignModal, setAssignModal] = useState<{ reservationId: string; roomTypeId: string; hotelId: string } | null>(null);
  const [assignRooms, setAssignRooms] = useState<any[]>([]);
  const [assignRoomId, setAssignRoomId] = useState("");
  const [assigning, setAssigning] = useState(false);

  async function fetchReservations() {
    setLoading(true);
    const supabase = createClient() as any;
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id, confirmation_number, status, check_in_date, check_out_date, total_amount, source,
          hotel_id, room_type_id,
          guests(first_name, last_name, email),
          rooms(room_number, room_types(name))
        `)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Database error fetching reservations:", error);
      }
      setReservations(data || []);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }

  // Load configuration lists
  async function loadConfig() {
    const supabase = createClient() as any;
    try {
      const { data: hotelData } = await supabase.from("hotels").select("id, name").eq("is_active", true);
      setHotels((hotelData && hotelData.length > 0) ? hotelData : [DEFAULT_HOTEL]);
      setSelectedHotelId(hotelData?.[0]?.id || DEFAULT_HOTEL.id);

      const { data: rtData } = await supabase.from("room_types").select("id, name, hotel_id").eq("is_active", true);
      setRoomTypes((rtData && rtData.length > 0) ? rtData : DEFAULT_ROOM_TYPES);

      const { data: rData } = await supabase.from("rooms").select("id, room_number, hotel_id, room_type_id, status").eq("is_active", true);
      setRooms((rData && rData.length > 0) ? rData : DEFAULT_ROOMS);
    } catch (err) {
      console.error("Failed to load metadata list:", err);
      setHotels([DEFAULT_HOTEL]);
      setRoomTypes(DEFAULT_ROOM_TYPES);
      setRooms(DEFAULT_ROOMS);
    }
  }

  useEffect(() => {
    fetchReservations();
    loadConfig();

    // Auto-poll every 8 seconds so any newly booked reservations immediately appear in the menu
    const interval = setInterval(() => {
      fetchReservations();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  function handleExportCSV() {
    if (reservations.length === 0) { toast.error("No data to export."); return; }
    const headers = ["Confirmation #", "Guest", "Room", "Check-In", "Check-Out", "Status", "Total Amount", "Source"];
    const rows = reservations.map(r => [
      r.confirmation_number ?? r.id.slice(0, 8),
      `${r.guests?.first_name ?? ""} ${r.guests?.last_name ?? ""}`.trim(),
      r.rooms?.room_number ?? "—",
      r.check_in_date ?? "",
      r.check_out_date ?? "",
      r.status ?? "",
      r.total_amount ?? 0,
      r.source ?? "direct",
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Reservations exported as CSV.");
  }

  // Fetch Room Types when hotel changes
  useEffect(() => {
    if (!selectedHotelId) return;
    async function loadRoomTypes() {
      const supabase = createClient() as any;
      const { data } = await supabase.from("room_types").select("id, name, base_price").eq("hotel_id", selectedHotelId).eq("is_active", true);
      setRoomTypes(data ?? []);
      if (data && data.length > 0) {
        setSelectedRoomTypeId(data[0].id);
      } else {
        setSelectedRoomTypeId("");
      }
    }
    loadRoomTypes();
  }, [selectedHotelId]);

  // Fetch specific Rooms when room type changes
  useEffect(() => {
    if (!selectedRoomTypeId) {
      setRooms([]);
      setSelectedRoomId("");
      return;
    }
    async function loadRooms() {
      const supabase = createClient() as any;
      const { data } = await supabase.from("rooms").select("id, room_number, status").eq("room_type_id", selectedRoomTypeId).eq("is_active", true);
      setRooms(data ?? []);
      if (data && data.length > 0) {
        setSelectedRoomId(data[0].id);
      } else {
        setSelectedRoomId("");
      }
    }
    loadRooms();
  }, [selectedRoomTypeId]);

  const filtered = reservations.filter(r => {
    const guestName = `${r.guests?.first_name ?? ""} ${r.guests?.last_name ?? ""}`.toLowerCase();
    const guestEmailAddr = (r.guests?.email ?? "").toLowerCase();
    const code = (r.confirmation_number ?? r.id ?? "").toLowerCase();
    const roomNum = String(r.rooms?.room_number ?? "").toLowerCase();
    const matchSearch = 
      guestName.includes(search.toLowerCase()) || 
      guestEmailAddr.includes(search.toLowerCase()) || 
      code.includes(search.toLowerCase()) || 
      roomNum.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const openAssignRoom = async (r: any) => {
    const supabase = createClient() as any;
    const { data } = await supabase
      .from("rooms")
      .select("id, room_number, status, room_type_id, room_types(name)")
      .eq("hotel_id", r.hotel_id)
      .eq("status", "available")
      .eq("is_active", true)
      .order("room_number");
    const roomList = (data ?? []) as any[];
    // Sort roomList so rooms matching r.room_type_id come first
    roomList.sort((a, b) => {
      const aMatch = a.room_type_id === r.room_type_id ? 1 : 0;
      const bMatch = b.room_type_id === r.room_type_id ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return a.room_number.localeCompare(b.room_number);
    });
    setAssignRooms(roomList);
    setAssignRoomId(roomList[0]?.id ?? "");
    setAssignModal({ reservationId: r.id, roomTypeId: r.room_type_id, hotelId: r.hotel_id });
  };

  const handleAssignRoom = async () => {
    if (!assignModal || !assignRoomId) { toast.error("Please select a room."); return; }
    setAssigning(true);
    const supabase = createClient() as any;
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ room_id: assignRoomId })
        .eq("id", assignModal.reservationId);
      if (error) throw error;
      await supabase.from("rooms").update({ status: "reserved" }).eq("id", assignRoomId);
      toast.success("Room assigned successfully.");
      setAssignModal(null);
      fetchReservations();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign room.");
    } finally {
      setAssigning(false);
    }
  };

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === "confirmed").length,
    checkedIn: reservations.filter(r => r.status === "checked_in").length,
    revenue: reservations.filter(r => !["cancelled", "no_show"].includes(r.status)).reduce((s, r) => s + (Number(r.total_amount) || 0), 0),
  };

  const openNewReservationModal = () => {
    setGuestFirstName("");
    setGuestLastName("");
    setGuestEmail("");
    setGuestPhone("");
    setCheckIn("");
    setCheckOut("");
    setAdults("1");
    setChildren("0");
    setPaymentStatus("pending");
    if (hotels.length > 0) {
      setSelectedHotelId(hotels[0].id);
    }
    setShowModal(true);
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestFirstName || !guestLastName || !guestEmail || !checkIn || !checkOut || !selectedHotelId || !selectedRoomTypeId) {
      toast.error("Please fill in all required fields (Guest Name, Email, Location, Dates, Suite).");
      return;
    }

    setSubmitting(true);
    const supabase = createClient() as any;
    try {
      // 1. Create or locate Guest ID
      let guestId = null;
      const { data: existingGuest } = await supabase
        .from("guests")
        .select("id")
        .eq("email", guestEmail)
        .eq("hotel_id", selectedHotelId)
        .maybeSingle();

      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        const { data: newGuest, error: guestErr } = await supabase
          .from("guests")
          .insert({
            hotel_id: selectedHotelId,
            first_name: guestFirstName,
            last_name: guestLastName,
            email: guestEmail,
            phone: guestPhone || null,
          })
          .select("id")
          .single();

        if (guestErr) throw guestErr;
        guestId = newGuest.id;
      }

      // 2. Pricing totals
      const roomTypeInfo = roomTypes.find(rt => rt.id === selectedRoomTypeId);
      const roomRate = roomTypeInfo ? Number(roomTypeInfo.base_price) : 0;
      const nightsCount = Math.max(1, (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 3600 * 24));
      
      const subtotal = roomRate * nightsCount;
      const taxAmount = subtotal * 0.12;
      const totalAmount = subtotal + taxAmount;

      const confirmationNum = "CONF-" + Math.random().toString(36).substring(2, 10).toUpperCase();

      // 2b. Double-booking check: Decline if room or suite is already taken
      if (selectedRoomId) {
        const { data: conflict } = await supabase
          .from("reservations")
          .select("id")
          .eq("room_id", selectedRoomId)
          .not("status", "in", '("cancelled","refunded","checked_out")')
          .lt("check_in_date", checkOut)
          .gt("check_out_date", checkIn)
          .limit(1);

        if (conflict && conflict.length > 0) {
          throw new Error("Booking Declined: Room is already booked or occupied for the selected dates.");
        }
      }

      // 3. Create Reservation
      const { data: reservation, error: resErr } = await supabase
        .from("reservations")
        .insert({
          hotel_id: selectedHotelId,
          confirmation_number: confirmationNum,
          guest_id: guestId,
          room_type_id: selectedRoomTypeId,
          room_id: selectedRoomId || null,
          check_in_date: checkIn,
          check_out_date: checkOut,
          adults: parseInt(adults, 10),
          children: parseInt(children, 10),
          room_rate: roomRate,
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          paid_amount: paymentStatus === "completed" ? totalAmount : 0,
          status: "confirmed",
          source: "walk_in",
        })
        .select("id")
        .single();

      if (resErr) throw resErr;

      // 4. Update room status if specific room was assigned
      if (selectedRoomId) {
        await supabase
          .from("rooms")
          .update({ status: "reserved" })
          .eq("id", selectedRoomId);
      }

      // 5. Create Payment record if fully paid
      if (paymentStatus === "completed") {
        const { data: dbPaymentMethod } = await supabase
          .from("payment_methods")
          .select("id")
          .eq("type", "cash")
          .maybeSingle();

        await supabase
          .from("payments")
          .insert({
            hotel_id: selectedHotelId,
            reservation_id: reservation.id,
            guest_id: guestId,
            payment_method_id: dbPaymentMethod?.id || null,
            amount: totalAmount,
            status: "completed",
            gateway: "cash",
            processed_at: new Date().toISOString(),
          });
      }

      toast.success(`Reservation created successfully: ${confirmationNum}`);
      setShowModal(false);
      fetchReservations();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to log reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Reservations</h1>
          <p className="page-subtitle">Manage all guest bookings and stays.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchReservations} variant="outline" size="sm" className="rounded-xl border-border/80">
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="rounded-xl border-border/80">
            <Download className="h-3.5 w-3.5 mr-2" /> Export
          </Button>
          <Button onClick={openNewReservationModal} variant="gold" size="sm" className="rounded-xl">
            <Plus className="h-3.5 w-3.5 mr-2" /> New Reservation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: loading ? "—" : stats.total, color: "text-foreground" },
          { label: "Confirmed", value: loading ? "—" : stats.confirmed, color: "text-emerald-600" },
          { label: "Checked In", value: loading ? "—" : stats.checkedIn, color: "text-navy-600 dark:text-navy-400" },
          { label: "Total Revenue", value: loading ? "—" : formatCurrency(stats.revenue), color: "text-gold-600" },
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guest name, code, or room number…"
            className="pl-9 h-9 rounded-xl"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${statusFilter === s ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && reservations.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <CalendarDays className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Reservations Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Reservations will appear here once guests start booking. Create the first one manually.
              </p>
            </div>
            <Button onClick={openNewReservationModal} variant="gold" size="sm" className="rounded-xl mt-2">
              <Plus className="h-4 w-4 mr-2" /> Create First Reservation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && reservations.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Guest</th>
                    <th className="px-4 py-3 text-left">Room</th>
                    <th className="px-4 py-3 text-left">Check In</th>
                    <th className="px-4 py-3 text-left">Check Out</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(r => (
                    <tr key={r.id} className="hover:bg-muted/20 border-b border-border/30 last:border-0">
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{r.confirmation_number ?? r.id?.slice(0, 8)}</td>
                      <td className="px-4 py-3.5 font-medium">
                        {r.guests?.first_name} {r.guests?.last_name}
                        <p className="text-[10px] text-muted-foreground">{r.guests?.email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        {r.rooms?.room_number
                          ? <span>{r.rooms.room_number} <span className="text-muted-foreground text-xs">({r.rooms?.room_types?.name ?? ""})</span></span>
                          : <button
                              onClick={() => openAssignRoom(r)}
                              className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium hover:underline"
                            >
                              <BedDouble className="h-3 w-3" /> Assign Room
                            </button>
                        }
                      </td>
                      <td className="px-4 py-3.5 text-sm">{r.check_in_date}</td>
                      <td className="px-4 py-3.5 text-sm">{r.check_out_date}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-gold-600">{formatCurrency(r.total_amount ?? 0)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">No reservations match your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {filtered.length} results</p>
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

      {/* New Reservation Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="my-8 bg-white dark:bg-charcoal-900 border border-border/40 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/40">
              <h3 className="font-semibold text-lg font-display text-foreground">Create Manual Booking</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateReservation} className="p-6 space-y-4">
              
              {/* Guest Profile Section */}
              <div className="space-y-3 bg-slate-50 dark:bg-charcoal-800/40 p-4 rounded-2xl border border-border/30">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5"><User className="h-3 w-3" /> Guest Details</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="modalFirst" className="text-xs">First Name</Label>
                    <Input id="modalFirst" required placeholder="John" value={guestFirstName} onChange={e => setGuestFirstName(e.target.value)} className="rounded-xl h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="modalLast" className="text-xs">Last Name</Label>
                    <Input id="modalLast" required placeholder="Doe" value={guestLastName} onChange={e => setGuestLastName(e.target.value)} className="rounded-xl h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="modalEmail" className="text-xs">Email Address</Label>
                    <Input id="modalEmail" required type="email" placeholder="john@example.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="rounded-xl h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="modalPhone" className="text-xs">Phone Number</Label>
                    <Input id="modalPhone" placeholder="+63 917..." value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="rounded-xl h-9" />
                  </div>
                </div>
              </div>

              {/* Hotel Location select */}
              <div className="space-y-1">
                <Label className="text-xs">Select Hotel Location</Label>
                <select
                  value={selectedHotelId}
                  onChange={e => setSelectedHotelId(e.target.value)}
                  className="w-full h-9 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none"
                >
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* Checkin / Checkout */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="modalCheckin" className="text-xs">Check-in Date</Label>
                  <Input id="modalCheckin" type="date" required value={checkIn} onChange={e => setCheckIn(e.target.value)} className="rounded-xl h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="modalCheckout" className="text-xs">Check-out Date</Label>
                  <Input id="modalCheckout" type="date" required value={checkOut} onChange={e => setCheckOut(e.target.value)} className="rounded-xl h-9" />
                </div>
              </div>

              {/* Room Type & Specific Room */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Suite Category</Label>
                  <select
                    value={selectedRoomTypeId}
                    onChange={e => setSelectedRoomTypeId(e.target.value)}
                    className="w-full h-9 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none"
                  >
                    {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.name} (PHP {Number(rt.base_price).toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Assign Room Number</Label>
                  <select
                    value={selectedRoomId}
                    onChange={e => setSelectedRoomId(e.target.value)}
                    className="w-full h-9 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none"
                  >
                    <option value="">Unassigned (Auto-assign on check-in)</option>
                    {rooms.map(rm => (
                      <option key={rm.id} value={rm.id}>Room {rm.room_number} ({rm.status})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Adults, Children, and Payment */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Adults</Label>
                  <select value={adults} onChange={e => setAdults(e.target.value)} className="w-full h-9 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none">
                    <option value="1">1 Adult</option>
                    <option value="2">2 Adults</option>
                    <option value="3">3 Adults</option>
                    <option value="4">4 Adults</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Children</Label>
                  <select value={children} onChange={e => setChildren(e.target.value)} className="w-full h-9 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none">
                    <option value="0">No Children</option>
                    <option value="1">1 Child</option>
                    <option value="2">2 Children</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Payment</Label>
                  <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full h-9 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none">
                    <option value="pending">Unpaid (Post-pay)</option>
                    <option value="completed">Paid Cash (Complete)</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl h-10">
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={submitting} className="flex-1 rounded-xl h-10 flex items-center justify-center gap-1.5">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Booking"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Assign Room Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm border border-border/60">
            <div className="flex items-center justify-between p-5 border-b border-border/40">
              <div>
                <h2 className="text-base font-semibold font-display">Assign Room</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Choose an available room to assign to this reservation.</p>
              </div>
              <button onClick={() => setAssignModal(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="h-4 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {assignRooms.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <BedDouble className="h-8 w-8 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">No available rooms found for this room type.</p>
                  <p className="text-xs text-muted-foreground">All rooms of this type are currently occupied or reserved.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select Room Number</label>
                    <select
                      className="w-full h-9 rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/40"
                      value={assignRoomId}
                      onChange={e => setAssignRoomId(e.target.value)}
                    >
                      {assignRooms.map(rm => {
                        const isMatch = rm.room_type_id === assignModal.roomTypeId;
                        return (
                          <option key={rm.id} value={rm.id}>
                            Room {rm.room_number} — {rm.room_types?.name ?? "Room"} {isMatch ? "★ (Matches booked category)" : "(Alternative)"}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setAssignModal(null)} disabled={assigning}>
                      Cancel
                    </Button>
                    <Button variant="gold" size="sm" className="flex-1 rounded-xl" onClick={handleAssignRoom} disabled={assigning || !assignRoomId}>
                      {assigning ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Assigning…</> : "Assign Room"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
