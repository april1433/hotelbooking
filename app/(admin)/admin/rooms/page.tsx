/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatusBadge, Button, Input } from "@/components/ui";
import { Search, Plus, BedDouble, Edit, Wrench, RefreshCw, Filter, X, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const STATUSES = ["all", "available", "occupied", "reserved", "maintenance", "out_of_order", "cleaning"];
const CLEANING_STATUSES = ["clean", "dirty", "in_progress", "inspected", "do_not_disturb"];

const ROOM_TYPE_COLORS: Record<string, string> = {
  "Deluxe King":        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Executive Suite":    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Presidential Suite": "bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400",
  "Penthouse":          "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal and Form states
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const [hotels, setHotels] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  const [roomNumber, setRoomNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState("");
  const [roomStatus, setRoomStatus] = useState("available");
  const [cleaningStatus, setCleaningStatus] = useState("clean");
  const [viewType, setViewType] = useState("");
  const [notes, setNotes] = useState("");

  async function fetchRooms() {
    setLoading(true);
    const supabase = createClient() as any;
    try {
      const { data } = await supabase
        .from("rooms")
        .select("*, room_types(name, base_price, max_occupancy), hotels(name)")
        .order("room_number", { ascending: true });
      setRooms(data ?? []);
    } catch (err) {
      console.error("Error loading rooms:", err);
    } finally {
      setLoading(false);
    }
  }

  // Load config data for modal
  async function loadConfigData() {
    const supabase = createClient() as any;
    try {
      const { data: hotelData } = await supabase.from("hotels").select("id, name").eq("is_active", true);
      setHotels(hotelData ?? []);
      
      const { data: rtData } = await supabase.from("room_types").select("id, name, hotel_id").eq("is_active", true);
      setRoomTypes(rtData ?? []);
    } catch (err) {
      console.error("Error loading modal metadata:", err);
    }
  }

  useEffect(() => {
    fetchRooms();
    loadConfigData();
  }, []);

  // Filter room types based on selected hotel
  const filteredRoomTypes = roomTypes.filter(rt => rt.hotel_id === selectedHotelId);

  const filtered = rooms.filter(r => {
    const typeName = r.room_types?.name ?? "";
    const hotelName = r.hotels?.name ?? "";
    const matchSearch = 
      String(r.room_number).includes(search) || 
      typeName.toLowerCase().includes(search.toLowerCase()) ||
      hotelName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: rooms.length,
    available: rooms.filter(r => r.status === "available").length,
    occupied: rooms.filter(r => r.status === "occupied").length,
    maintenance: rooms.filter(r => r.status === "maintenance" || r.status === "out_of_order").length,
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setRoomNumber("");
    setFloorNumber("");
    setSelectedHotelId(hotels[0]?.id || "");
    setSelectedRoomTypeId("");
    setRoomStatus("available");
    setCleaningStatus("clean");
    setViewType("");
    setNotes("");
    setShowModal(true);
  };

  const openEditModal = (room: any) => {
    setEditingRoom(room);
    setRoomNumber(room.room_number);
    setFloorNumber(room.floor_number ? String(room.floor_number) : "");
    setSelectedHotelId(room.hotel_id);
    setSelectedRoomTypeId(room.room_type_id);
    setRoomStatus(room.status);
    setCleaningStatus(room.cleaning_status || "clean");
    setViewType(room.view_type || "");
    setNotes(room.notes || "");
    setShowModal(true);
  };

  // Select first room type automatically when hotel selection changes
  useEffect(() => {
    if (filteredRoomTypes.length > 0) {
      // Keep existing selected if still valid, otherwise set to first
      const isValid = filteredRoomTypes.some(rt => rt.id === selectedRoomTypeId);
      if (!isValid) {
        setSelectedRoomTypeId(filteredRoomTypes[0].id);
      }
    } else {
      setSelectedRoomTypeId("");
    }
  }, [selectedHotelId, roomTypes]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber || !selectedHotelId || !selectedRoomTypeId) {
      toast.error("Please fill in Room Number, Hotel, and Room Type.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient() as any;
    try {
      const payload = {
        hotel_id: selectedHotelId,
        room_type_id: selectedRoomTypeId,
        room_number: roomNumber,
        floor_number: floorNumber ? parseInt(floorNumber, 10) : null,
        status: roomStatus,
        cleaning_status: cleaningStatus,
        notes: notes || null,
      };

      let error;
      if (editingRoom) {
        // UPDATE
        const { error: err } = await supabase
          .from("rooms")
          .update(payload)
          .eq("id", editingRoom.id);
        error = err;
      } else {
        // INSERT
        const { error: err } = await supabase
          .from("rooms")
          .insert(payload);
        error = err;
      }

      if (error) throw error;

      toast.success(editingRoom ? "Room updated successfully." : "New room added successfully.");
      setShowModal(false);
      fetchRooms();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save room details.");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteRoom = async (roomId: string, roomNum: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Room ${roomNum}?`)) {
      return;
    }
    const supabase = createClient() as any;
    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);
      if (error) throw error;
      toast.success(`Room ${roomNum} deleted successfully.`);
      fetchRooms();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || `Failed to delete Room ${roomNum}.`);
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Rooms Management</h1>
          <p className="page-subtitle">Monitor and manage all room inventory and status.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchRooms} variant="outline" size="sm" className="rounded-xl border-border/80">
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={openAddModal} variant="gold" size="sm" className="rounded-xl">
            <Plus className="h-3.5 w-3.5 mr-2" /> Add Room
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Rooms",    value: counts.total,       color: "text-foreground" },
          { label: "Available",      value: counts.available,   color: "text-emerald-600" },
          { label: "Occupied",       value: counts.occupied,    color: "text-navy-600 dark:text-navy-400" },
          { label: "Out of Service", value: counts.maintenance, color: "text-red-500" },
        ].map((s, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search room number, type, or hotel…"
            className="pl-9 h-9 rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${statusFilter === s ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}>
              {s === "all" ? "All Status" : s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && rooms.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <BedDouble className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Rooms Added Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Add your first room to start managing inventory.</p>
            </div>
            <Button onClick={openAddModal} variant="gold" size="sm" className="rounded-xl mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add First Room
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Room Grid */}
      {!loading && rooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((room) => {
            const typeName = room.room_types?.name ?? "Unknown";
            const rate = room.room_types?.base_price ?? 0;
            const capacity = room.room_types?.max_occupancy ?? 0;
            const hotelName = room.hotels?.name ?? "Grand Azure";

            return (
              <Card key={room.id} className="relative group hover:shadow-luxury-hover transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold font-display">{room.room_number}</span>
                        <span className="text-xs text-muted-foreground">Floor {room.floor_number ?? "—"}</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${ROOM_TYPE_COLORS[typeName] || "bg-slate-100 text-slate-700 dark:bg-charcoal-800"}`}>
                          {typeName}
                        </span>
                        <p className="text-[9px] text-muted-foreground font-mono">{hotelName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={room.status} />
                      {room.cleaning_status && <StatusBadge status={room.cleaning_status} />}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span>Capacity</span>
                      <span className="text-foreground font-medium">{capacity} guests</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate/Night</span>
                      <span className="text-gold-600 font-semibold">{formatCurrency(rate)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(room)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg border border-border/60 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="h-3 w-3" /> Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteRoom(room.id, room.room_number)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg border border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <Filter className="h-4 w-4" /> No rooms match your search.
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Room Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-charcoal-900 border border-border/40 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/40">
              <h3 className="font-semibold text-lg font-display text-foreground">{editingRoom ? "Edit Room Details" : "Add New Room"}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              {/* Hotel Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Hotel Location</label>
                <select
                  value={selectedHotelId}
                  onChange={(e) => setSelectedHotelId(e.target.value)}
                  className="w-full h-10 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none"
                >
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* Room Number & Floor Number */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modalRoomNum" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Room Number</label>
                  <Input
                    id="modalRoomNum"
                    required
                    placeholder="101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="modalFloorNum" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Floor Number</label>
                  <Input
                    id="modalFloorNum"
                    type="number"
                    placeholder="1"
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Room Type Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Room Type</label>
                <select
                  value={selectedRoomTypeId}
                  onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                  className="w-full h-10 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none"
                >
                  {filteredRoomTypes.length === 0 && <option value="">No types setup for this location</option>}
                  {filteredRoomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>

              {/* Status & Cleaning Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Room Status</label>
                  <select
                    value={roomStatus}
                    onChange={(e) => setRoomStatus(e.target.value)}
                    className="w-full h-10 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none capitalize"
                  >
                    {STATUSES.filter(s => s !== "all").map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Cleaning Status</label>
                  <select
                    value={cleaningStatus}
                    onChange={(e) => setCleaningStatus(e.target.value)}
                    className="w-full h-10 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none capitalize"
                  >
                    {CLEANING_STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="modalNotes" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Internal Notes</label>
                <textarea
                  id="modalNotes"
                  placeholder="Additional room info..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[70px] border border-input rounded-xl bg-background p-3 text-sm focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={submitting} className="flex-1 rounded-xl flex items-center justify-center gap-1.5">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Room"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
