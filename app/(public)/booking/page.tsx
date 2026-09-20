/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Star, Receipt, Check, User, CreditCard, Loader2 } from "lucide-react";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { calculateNights, formatCurrency } from "@/lib/utils";
import { BOOKING_EXTRAS } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";

function BookingForm() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();

  // Booking schedule states
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");

  // Guest details state
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "gcash">("card");
  const [loading, setLoading] = useState(false);
  const [fetchingRooms, setFetchingRooms] = useState(false);

  // 1. Fetch Hotels
  useEffect(() => {
    async function loadHotels() {
      const supabase = createClient() as any;
      const { data } = await supabase.from("hotels").select("id, name").eq("is_active", true);
      const list = data ?? [];
      setHotels(list);

      // Read initial hotelId from URL
      const urlHotelId = searchParams.get("hotelId");
      if (urlHotelId && list.some((h: any) => h.id === urlHotelId)) {
        setSelectedHotelId(urlHotelId);
      } else if (list.length > 0) {
        setSelectedHotelId(list[0].id);
      }
    }
    loadHotels();
  }, [searchParams]);

  // 2. Fetch Room Types when hotel changes
  useEffect(() => {
    if (!selectedHotelId) return;

    async function loadRoomTypes() {
      setFetchingRooms(true);
      const supabase = createClient() as any;
      const { data: rtData } = await supabase
        .from("room_types")
        .select("*")
        .eq("hotel_id", selectedHotelId)
        .eq("is_active", true);

      const { data: roomsData } = await supabase
        .from("rooms")
        .select("room_type_id");

      const activeRoomTypeIds = new Set(roomsData?.map((r: any) => r.room_type_id) ?? []);
      const list = (rtData ?? []).filter((rt: any) => activeRoomTypeIds.has(rt.id));

      setRoomTypes(list);

      // Auto-select roomType if passed in URL
      const urlRoomTypeId = searchParams.get("roomTypeId");
      if (urlRoomTypeId && list.some((rt: any) => rt.id === urlRoomTypeId)) {
        setSelectedRoom(urlRoomTypeId);
      } else if (list.length > 0) {
        setSelectedRoom(list[0].id);
      } else {
        setSelectedRoom(null);
      }
      setFetchingRooms(false);
    }
    loadRoomTypes();
  }, [selectedHotelId, searchParams]);

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 1;
  const activeRoom = roomTypes.find(r => r.id === selectedRoom);
  const roomPrice = activeRoom ? Number(activeRoom.base_price) : 0;
  
  const extrasTotal = selectedExtras.reduce((sum, extraId) => {
    const ext = BOOKING_EXTRAS.find(e => e.id === extraId);
    return sum + (ext ? ext.price : 0);
  }, 0);

  const subtotal = (roomPrice * nights) + extrasTotal;
  const tax = subtotal * 0.12; // 12% VAT
  const total = subtotal + tax;

  const handleExtraToggle = (id: string) => {
    setSelectedExtras(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || !selectedRoom || !selectedHotelId) {
      toast.error("Please select hotel location, dates, and choice of room type.");
      return;
    }

    const email = user ? user.email : guestEmail;
    const firstName = profile ? profile.first_name : guestFirstName;
    const lastName = profile ? profile.last_name : guestLastName;
    const phone = profile ? profile.phone : guestPhone;

    if (!email || !firstName || !lastName) {
      toast.error("Please provide guest contact details (Name & Email).");
      return;
    }

    setLoading(true);

    const bookingPayload = {
      hotelId: selectedHotelId,
      roomTypeId: selectedRoom,
      roomTypeName: activeRoom?.name || "Luxury Suite",
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: parseInt(adults, 10),
      children: parseInt(children, 10),
      extras: selectedExtras.map(id => {
        const ext = BOOKING_EXTRAS.find(e => e.id === id);
        return { name: ext?.name || id, price: ext?.price || 0, quantity: 1 };
      }),
      subtotal,
      taxAmount: tax,
      totalAmount: total,
      guestEmail: email,
      guestFirstName: firstName,
      guestLastName: lastName,
      guestPhone: phone,
      profileId: user?.id || null,
    };

    try {
      if (paymentMethod === "gcash") {
        sessionStorage.setItem("azure_pending_booking", JSON.stringify(bookingPayload));
        window.location.assign("/checkout/gcash");
      } else {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingPayload),
        });

        const data = await response.json();

        if (!response.ok || !data.url) {
          throw new Error(data.error || "Failed to create checkout session");
        }

        window.location.assign(data.url);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An unexpected error occurred during reservation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Booking Config inputs */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Guest Details Widget */}
        <Card className="p-6 bg-white dark:bg-charcoal-900 border-border/40 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gold-500" /> Guest Details
          </h2>
          
          {user && profile ? (
            <div className="bg-gold-500/5 border border-gold-500/10 rounded-xl p-4 space-y-1">
              <p className="text-sm font-medium text-foreground">
                Booking as: <span className="text-gold-600 dark:text-gold-400">{profile.first_name} {profile.last_name}</span>
              </p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Logged-in Retainer Account</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-normal mb-2">
                Enter details to reserve your stay as a guest, or login to earn luxury retainer reward points.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={guestFirstName} 
                    onChange={(e) => setGuestFirstName(e.target.value)} 
                    placeholder="John" 
                    required 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={guestLastName} 
                    onChange={(e) => setGuestLastName(e.target.value)} 
                    placeholder="Doe" 
                    required 
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={guestEmail} 
                    onChange={(e) => setGuestEmail(e.target.value)} 
                    placeholder="john.doe@example.com" 
                    required 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={guestPhone} 
                    onChange={(e) => setGuestPhone(e.target.value)} 
                    placeholder="+63 917 123 4567" 
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Date search widget */}
        <Card className="p-6 bg-white dark:bg-charcoal-900 border-border/40 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-gold-500" /> Stay Schedule
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            
            {/* Hotel Location Dropdown */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="hotel" className="text-xs uppercase tracking-wider text-muted-foreground">Select Location</Label>
              <select 
                id="hotel" 
                value={selectedHotelId} 
                onChange={(e) => {
                  setSelectedHotelId(e.target.value);
                  setSelectedRoom(null);
                }}
                className="w-full h-10 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none"
              >
                {hotels.length === 0 && <option value="">Loading locations...</option>}
                {hotels.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkIn" className="text-xs uppercase tracking-wider text-muted-foreground">Check-in Date</Label>
              <Input id="checkIn" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkOut" className="text-xs uppercase tracking-wider text-muted-foreground">Check-out Date</Label>
              <Input id="checkOut" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="adults" className="text-xs uppercase tracking-wider text-muted-foreground">Adults</Label>
              <select id="adults" value={adults} onChange={(e) => setAdults(e.target.value)} className="w-full h-10 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none">
                <option value="1">1 Adult</option>
                <option value="2">2 Adults</option>
                <option value="3">3 Adults</option>
                <option value="4">4 Adults</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="children" className="text-xs uppercase tracking-wider text-muted-foreground">Children</Label>
              <select id="children" value={children} onChange={(e) => setChildren(e.target.value)} className="w-full h-10 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none">
                <option value="0">No Children</option>
                <option value="1">1 Child</option>
                <option value="2">2 Children</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Room selection */}
        <Card className="p-6 bg-white dark:bg-charcoal-900 border-border/40 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-gold-500" /> Select Room Type
          </h2>
          
          {fetchingRooms ? (
            <div className="flex items-center justify-center py-10 gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-gold-500" /> Loading suites...
            </div>
          ) : roomTypes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No suites available for this hotel location.</p>
          ) : (
            <div className="space-y-3">
              {roomTypes.map((rm) => (
                <div 
                  key={rm.id}
                  onClick={() => setSelectedRoom(rm.id)}
                  className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    selectedRoom === rm.id 
                      ? "border-gold-500 bg-gold-50/20" 
                      : "border-border/50 hover:bg-muted/30"
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-semibold">{rm.name}</h4>
                    <p className="text-xs text-muted-foreground font-light mt-0.5">{rm.description || "Luxury suite configuration."}</p>
                  </div>
                  <span className="text-sm font-semibold text-gold-600 dark:text-gold-400">
                    PHP {Number(rm.base_price).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Extras selection */}
        <Card className="p-6 bg-white dark:bg-charcoal-900 border-border/40 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Tailored Amenities & Extras</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BOOKING_EXTRAS.map((ext) => {
              const active = selectedExtras.includes(ext.id);
              return (
                <div 
                  key={ext.id}
                  onClick={() => handleExtraToggle(ext.id)}
                  className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    active ? "border-gold-500 bg-gold-50/10" : "border-border/50 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      active ? "border-gold-500 bg-gold-500 text-white" : "border-border"
                    }`}>
                      {active && <Check className="h-3 w-3" />}
                    </div>
                    <span className="text-xs font-semibold">{ext.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">PHP {ext.price}</span>
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      {/* Invoicing Summary Column */}
      <div className="space-y-6">
        <Card className="p-6 bg-white dark:bg-charcoal-900 border-border/40 rounded-2xl shadow-sm">
          <CardHeader className="p-0 pb-4 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4.5 w-4.5 text-gold-500" /> Booking Summary
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0 pt-4 space-y-3 text-xs leading-normal">
            <div className="flex justify-between text-muted-foreground">
              <span>Room Charges ({nights} nights)</span>
              <span className="font-semibold text-foreground">{formatCurrency(roomPrice * nights)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tailored Extras</span>
              <span className="font-semibold text-foreground">{formatCurrency(extrasTotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>12% Tax (VAT)</span>
              <span className="font-semibold text-foreground">{formatCurrency(tax)}</span>
            </div>
            
            <div className="border-t border-border/50 pt-3 flex justify-between text-sm font-bold text-foreground">
              <span>Total Due</span>
              <span className="text-gold-600 dark:text-gold-400">{formatCurrency(total)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="border-t border-border/50 pt-4 space-y-2.5">
              <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider block">Payment Method</span>
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3 border rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                    paymentMethod === "card"
                      ? "border-gold-500 bg-gold-50/10 text-gold-600 dark:text-gold-400 font-semibold"
                      : "border-border/50 hover:bg-muted/20 text-muted-foreground"
                  }`}
                >
                  <CreditCard className="h-4.5 w-4.5 mb-1" />
                  <span className="text-[10px] font-bold">Credit Card</span>
                </div>
                <div
                  onClick={() => setPaymentMethod("gcash")}
                  className={`p-3 border rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                    paymentMethod === "gcash"
                      ? "border-gold-500 bg-gold-50/10 text-blue-600 dark:text-blue-400 font-semibold"
                      : "border-border/50 hover:bg-muted/20 text-muted-foreground"
                  }`}
                >
                  <span className="font-black text-sm italic tracking-tighter leading-none mb-1">g) gcash</span>
                  <span className="text-[10px] font-bold">GCash Portal</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button variant="gold" size="lg" className="w-full rounded-xl font-semibold" loading={loading}>
                Confirm & Go to Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </form>
  );
}

export default function BookingPage() {
  return (
    <div className="bg-cream-50 dark:bg-charcoal-950 min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-5xl">
        <Suspense fallback={
          <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
            <span className="text-sm font-medium">Initializing reservation form...</span>
          </div>
        }>
          <BookingForm />
        </Suspense>
      </div>
    </div>
  );
}
