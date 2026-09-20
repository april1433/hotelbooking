"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from "@/components/ui";
import { UserPlus, Calendar, CreditCard, BedDouble, Save, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface RoomType {
  id: string;
  name: string;
  base_rate_per_night: number;
}

export default function WalkInPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [checkIn] = useState(new Date().toISOString().split("T")[0]);
  const [checkOut, setCheckOut] = useState("");
  const [nights, setNights] = useState(1);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [rooms, setRooms] = useState<{ id: string; room_number: string; room_type_id?: string; status?: string }[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [deposit, setDeposit] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchRoomTypesAndRooms() {
    setLoading(true);
    const supabase = createClient();
    try {
      const [typesRes, roomsRes] = await Promise.all([
        supabase.from("room_types").select("id, name, base_rate_per_night"),
        supabase.from("rooms").select("id, room_number, status, room_type_id").eq("status", "available"),
      ]);

      const types = (typesRes.data ?? []) as any[];
      setRoomTypes(types);
      if (types.length > 0) {
        setSelectedTypeId(types[0].id);
      }

      setRooms((roomsRes.data ?? []) as any[]);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRoomTypesAndRooms(); }, []);

  const selectedType = roomTypes.find(t => t.id === selectedTypeId);
  const availableRoomsForType = rooms.filter(r => r.room_type_id === selectedTypeId);

  const rate = selectedType?.base_rate_per_night ?? 0;
  const roomTotal = rate * nights;
  const vatAmount = roomTotal * 0.12;
  const totalCost = roomTotal + vatAmount;

  const handleNightsChange = (val: string) => {
    const num = parseInt(val) || 1;
    setNights(num);
    const date = new Date(checkIn);
    date.setDate(date.getDate() + num);
    setCheckOut(date.toISOString().split("T")[0]);
  };

  const handleBook = async () => {
    if (!firstName || !lastName || !email || !phone || !checkOut || !selectedRoomId) return;
    const supabase = createClient();
    try {
      // 1. Create/find profile
      const { data: profile } = await supabase
        .from("profiles")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          role: "guest",
        } as any)
        .select()
        .single();

      if (!profile) return;

      // 2. Create reservation and update room status to reserved/occupied
      const { error: resError } = await supabase
        .from("reservations")
        .insert({
          guest_id: (profile as any).id,
          room_id: selectedRoomId,
          check_in_date: checkIn,
          check_out_date: checkOut,
          status: "checked_in",
          total_amount: totalCost,
          source: "walk_in",
        } as any);

      if (resError) return;

      await supabase
        .from("rooms" as any)
        .update({ status: "occupied" })
        .eq("id", selectedRoomId);

      setSaved(true);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <div>
        <h1 className="page-title flex items-center gap-2.5">
          <UserPlus className="h-7 w-7 text-muted-foreground" /> Walk-In Booking Form
        </h1>
        <p className="page-subtitle">Instantly register and check-in a new walk-in guest.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="lg:col-span-2 space-y-6">
          {saved ? (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h2 className="text-xl font-bold font-display">Walk-In Reservation Created</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Guest {firstName} {lastName} has been booked and successfully checked into the room.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <Button variant="gold" onClick={() => {
                    setSaved(false);
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setPhone("");
                    setSelectedRoomId("");
                    fetchRoomTypesAndRooms();
                  }}>Book Another Guest</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Guest Profile Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-display">Guest Personal Details</CardTitle>
                  <CardDescription>Primary profile data for the guest directory.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input placeholder="john.doe@email.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input placeholder="+63 917 123 4567" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stay Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-display">Stay &amp; Suite Allocation</CardTitle>
                  <CardDescription>Select room category and duration of stay.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Check-In Date</Label>
                      <Input type="date" value={checkIn} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Nights</Label>
                      <Input type="number" min="1" value={nights} onChange={e => handleNightsChange(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Check-Out Date</Label>
                      <Input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Suite/Room Type</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {roomTypes.map(type => (
                        <div
                          key={type.id}
                          onClick={() => { setSelectedTypeId(type.id); setSelectedRoomId(""); }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTypeId === type.id ? "border-gold-500 bg-gold-50/10" : "border-border/40 hover:border-navy-400"}`}
                        >
                          <BedDouble className="h-5 w-5 mb-2 text-muted-foreground" />
                          <h4 className="font-semibold text-xs">{type.name}</h4>
                          <p className="text-xs text-gold-600 mt-1 font-semibold">{formatCurrency(type.base_rate_per_night)}/night</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assign Available Room Number */}
                  {selectedTypeId && (
                    <div className="space-y-2 pt-2">
                      <Label>Select Available Room</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {availableRoomsForType.map(room => (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => setSelectedRoomId(room.id)}
                            className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${selectedRoomId === room.id ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}
                          >
                            Room {room.room_number}
                          </button>
                        ))}
                        {availableRoomsForType.length === 0 && (
                          <p className="text-xs text-red-500 col-span-full">No available rooms of this type currently.</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="sticky top-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" /> Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Suite Rate</span>
                  <span>{formatCurrency(rate)} / night</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{nights} night(s)</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-border/40 pt-2 text-sm">
                  <span>Room Charge</span>
                  <span>{formatCurrency(roomTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground pt-1">
                  <span>VAT (12%)</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-border/40 pt-3 text-gold-600">
                  <span>Total Due</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
              </div>

              {/* Deposit collection */}
              <div className="space-y-3 pt-3 border-t border-border/40">
                <Label>Security Deposit Collected (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">PHP</span>
                  <Input
                    type="number"
                    className="pl-12 rounded-xl text-sm"
                    placeholder="5000"
                    value={deposit || ""}
                    onChange={e => setDeposit(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <Button
                variant="gold"
                className="w-full rounded-xl gap-2 mt-2"
                onClick={handleBook}
                disabled={!firstName || !lastName || !email || !phone || !checkOut || !selectedRoomId || saved}
              >
                <Save className="h-4 w-4" /> Save Reservation &amp; Check-In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
