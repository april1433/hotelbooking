/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_HOTEL, DEFAULT_ROOM_TYPES } from "@/constants";

const FALLBACK_IMAGES: Record<string, string> = {
  presidential: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200&auto=format&fit=crop",
  executive: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop",
  deluxe: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop",
  sunset: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop",
  ocean: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
  standard: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop"
};

function getRoomImage(name: string, coverUrl?: string) {
  if (coverUrl) return coverUrl;
  const n = name.toLowerCase();
  if (n.includes("presidential")) return FALLBACK_IMAGES.presidential;
  if (n.includes("executive")) return FALLBACK_IMAGES.executive;
  if (n.includes("sunset")) return FALLBACK_IMAGES.sunset;
  if (n.includes("ocean")) return FALLBACK_IMAGES.ocean;
  if (n.includes("standard")) return FALLBACK_IMAGES.standard;
  return FALLBACK_IMAGES.deluxe;
}

export default function RoomsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedHotelId, setSelectedHotelId] = useState<string>("all");
  const [filterPrice, setFilterPrice] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const supabase = createClient() as any;
      try {
        // Fetch hotels
        const { data: hotelData } = await supabase
          .from("hotels")
          .select("id, name, city")
          .eq("is_active", true);
        setHotels(hotelData ?? []);

        // Fetch active room types, joining hotel name
        const { data: rtData } = await supabase
          .from("room_types")
          .select("*, hotels(name)")
          .eq("is_active", true);

        // Fetch existing room inventory (rooms table)
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("room_type_id");

        const activeRoomTypeIds = new Set(roomsData?.map((r: any) => r.room_type_id) ?? []);
        let dynamicRoomTypes = (rtData ?? []).filter((rt: any) => activeRoomTypeIds.has(rt.id));

        // Fallback to default catalog if database is not yet seeded
        if (dynamicRoomTypes.length === 0) {
          dynamicRoomTypes = (rtData && rtData.length > 0) ? rtData : DEFAULT_ROOM_TYPES;
        }

        setHotels((hotelData && hotelData.length > 0) ? hotelData : [DEFAULT_HOTEL]);
        setRoomTypes(dynamicRoomTypes);
      } catch (err) {
        console.error("Failed to load room types:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter logic
  const filtered = roomTypes.filter((rt) => {
    const matchHotel = selectedHotelId === "all" || rt.hotel_id === selectedHotelId;
    const matchPrice = filterPrice === null || rt.base_price <= filterPrice;
    return matchHotel && matchPrice;
  });

  return (
    <div className="bg-cream-50 dark:bg-charcoal-950 min-h-screen">
      
      {/* Banner */}
      <section className="relative h-[35vh] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-xs" />
        <div className="container relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-display font-bold">Suites & Residences</h1>
          <p className="text-xs uppercase tracking-widest text-gold-400 mt-3 font-semibold font-mono">Select Accommodations</p>
        </div>
      </section>

      {/* Filter and Grid */}
      <section className="py-16 container mx-auto px-6 max-w-6xl">
        
        {/* Hotel Filter Tabs */}
        <div className="flex flex-col gap-4 border-b border-border/50 pb-6 mb-12">
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Compass className="h-4.5 w-4.5 text-gold-500" />
              <span className="text-sm font-semibold text-foreground">Sort & Filters</span>
            </div>
            
            {/* Price Filter Buttons */}
            <div className="flex gap-2">
              <Button variant={filterPrice === null ? "gold" : "outline"} onClick={() => setFilterPrice(null)} className="rounded-xl text-xs h-9">All Prices</Button>
              <Button variant={filterPrice === 15000 ? "gold" : "outline"} onClick={() => setFilterPrice(15000)} className="rounded-xl text-xs h-9">Under PHP 15k</Button>
              <Button variant={filterPrice === 25000 ? "gold" : "outline"} onClick={() => setFilterPrice(25000)} className="rounded-xl text-xs h-9">Under PHP 25k</Button>
            </div>
          </div>

          {/* Hotel Location Tabs */}
          {!loading && hotels.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <button
                onClick={() => setSelectedHotelId("all")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  selectedHotelId === "all"
                    ? "bg-navy-800 text-white border-navy-800 dark:bg-gold-500 dark:text-navy-950 dark:border-gold-500"
                    : "bg-white text-muted-foreground border-border/50 hover:bg-slate-50 dark:bg-charcoal-900"
                }`}
              >
                All Locations
              </button>
              {hotels.map((hotel) => (
                <button
                  key={hotel.id}
                  onClick={() => setSelectedHotelId(hotel.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                    selectedHotelId === hotel.id
                      ? "bg-navy-800 text-white border-navy-800 dark:bg-gold-500 dark:text-navy-950 dark:border-gold-500"
                      : "bg-white text-muted-foreground border-border/50 hover:bg-slate-50 dark:bg-charcoal-900"
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  {hotel.name}
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
            <span className="text-sm font-medium">Loading accommodations catalog...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-charcoal-900 border border-dashed rounded-3xl p-8 max-w-md mx-auto">
            <Compass className="h-10 w-10 text-muted-foreground/45 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">No Accommodations Setup</h3>
            <p className="text-xs text-muted-foreground mt-1">There are no suites or rooms currently set up by administrators for this criteria. Please check back later.</p>
          </div>
        )}

        {/* Room Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filtered.map((room) => {
              const beds = room.bed_type || "King";
              const size = room.size_sqm ? `${room.size_sqm} sqm` : "45 sqm";
              const hotelName = room.hotels?.name || "Grand Azure";

              return (
                <div key={room.id} className="luxury-card flex flex-col h-full bg-white dark:bg-charcoal-900 border-border/40 overflow-hidden">
                  <div className="relative h-60 overflow-hidden shrink-0">
                    <img src={getRoomImage(room.name, room.cover_image_url)} alt={room.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                    
                    {/* Hotel Label */}
                    <div className="absolute top-4 left-4 bg-navy-950/80 backdrop-blur-md text-gold-400 px-2.5 py-1.2 rounded-lg text-[9px] uppercase tracking-wider font-semibold font-mono flex items-center gap-1 border border-gold-500/20">
                      <MapPin className="h-2.5 w-2.5" /> {hotelName.split(" ").slice(2).join(" ") || hotelName}
                    </div>

                    <div className="absolute top-4 right-4 bg-navy-950/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
                      PHP {Number(room.base_price).toLocaleString()}/night
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-display font-semibold mb-2">{room.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed font-light mb-4 truncate-3-lines">{room.description || "Unparalleled luxury experience featuring refined interior setups, bespoke amenities, and modern configurations for rest and corporate stays."}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wide text-muted-foreground font-mono mb-6">
                        <div>Beds: {beds}</div>
                        <div>Size: {size}</div>
                        <div className="col-span-2">Capacity: {room.max_occupancy} guests (Max: {room.max_adults} Adults)</div>
                      </div>
                    </div>

                    <Link href={`/booking?hotelId=${room.hotel_id}&roomTypeId=${room.id}`} className="w-full">
                      <Button variant="outline" className="w-full rounded-xl text-xs hover:border-gold-500 hover:text-gold-500 transition-colors">
                        Check Availability
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </section>

    </div>
  );
}
