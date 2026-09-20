/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CalendarDays, Users, Shield, Award, 
  Coffee, Wifi, Sparkles, UtensilsCrossed,
  ArrowRight, Compass, Wine, HeartHandshake,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const AMENITIES = [
  { icon: Wifi, title: "High-Speed Wi-Fi", desc: "Complimentary gigabit internet across the entire estate." },
  { icon: Wine, title: "Mini Bar & Lounge", desc: "Curated fine wines and locally sourced spirits in-room." },
  { icon: Coffee, title: "Artisanal Breakfast", desc: "Fresh pastries and gourmet coffee served daily." },
  { icon: UtensilsCrossed, title: "Fine Dining", desc: "Award-winning rooftop restaurant by Michelin-starred chefs." },
  { icon: Sparkles, title: "Luxury Spa", desc: "Rejuvenating body treatments, saunas, and hot springs." },
  { icon: Compass, title: "Private Concierge", desc: "24/7 bespoke tour planning and airport transitions." },
];

// Fallback images for dynamic room types
const FALLBACK_ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop"
];

export default function HomePage() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const [featuredRooms, setFeaturedRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    async function loadFeaturedRooms() {
      const supabase = createClient() as any;
      try {
        const { data: rtData } = await supabase
          .from("room_types")
          .select("*, hotels(name)")
          .eq("is_active", true);

        const { data: roomsData } = await supabase
          .from("rooms")
          .select("room_type_id");

        const activeRoomTypeIds = new Set(roomsData?.map((r: any) => r.room_type_id) ?? []);
        const dynamicRoomTypes = (rtData ?? []).filter((rt: any) => activeRoomTypeIds.has(rt.id));

        setFeaturedRooms(dynamicRoomTypes.slice(0, 3));
      } catch (err) {
        console.error("Error loading featured rooms:", err);
      } finally {
        setLoadingRooms(false);
      }
    }
    loadFeaturedRooms();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-cream-50 dark:bg-charcoal-950">
      
      {/* HERO SECTION */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop')"
          }}
        />
        {/* Dark Luxury Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-charcoal-950/65 to-charcoal-950" />

        {/* Hero Content */}
        <div className="container relative z-10 mx-auto px-6 text-center text-white flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
          >
            <Sparkles className="h-4 w-4 text-gold-400 animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-semibold text-gold-200">
              Welcome to Unmatched Elegance
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6 max-w-4xl"
          >
            Discover the Art of <span className="text-gold-400">Luxury Living</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-lg md:text-xl text-cream-200/90 max-w-2xl mb-12 font-light leading-relaxed"
          >
            A sanctuary where modern sophistication meets timeless heritage. Handcrafted hospitality, tailored just for you.
          </motion.p>

          {/* Quick Booking Widget */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="w-full max-w-4xl p-6 bg-white dark:bg-charcoal-900 rounded-2xl shadow-luxury-lg border border-border/40 grid grid-cols-1 md:grid-cols-4 gap-4 text-left"
          >
            <div className="flex flex-col gap-1.5 border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-gold-500" /> Check In
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-foreground focus:ring-0 font-medium text-sm focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5 border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-gold-500" /> Check Out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-foreground focus:ring-0 font-medium text-sm focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5 border-b md:border-b-0 pb-3 md:pb-0">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-gold-500" /> Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-foreground focus:ring-0 font-medium text-sm focus:outline-none"
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5">5+ Guests</option>
              </select>
            </div>

            <div className="flex items-center justify-center">
              <Link href={`/booking?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`} className="w-full">
                <Button variant="gold" size="lg" className="w-full rounded-xl">
                  Search Rooms
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* VALUE PROPOSITION / AWARDS */}
      <section className="py-20 bg-white dark:bg-charcoal-900 border-b border-border/40">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gold-100 dark:bg-gold-950/50 flex items-center justify-center text-gold-600 dark:text-gold-400 mb-6">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Michelin Star & Forbes Standard</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Consistently awarded Five Stars for stellar luxury, design excellence, and bespoke personalized care.
            </p>
          </div>

          <div className="flex flex-col items-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gold-100 dark:bg-gold-950/50 flex items-center justify-center text-gold-600 dark:text-gold-400 mb-6">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Seamless RLS Security & Comfort</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your safety, data integrity, and physical privacy are guaranteed by our leading-edge security details.
            </p>
          </div>

          <div className="flex flex-col items-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gold-100 dark:bg-gold-950/50 flex items-center justify-center text-gold-600 dark:text-gold-400 mb-6">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Bespoke Concierge Care</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Every room booking includes a designated personal host, ready to craft custom excursions.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED ROOMS */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <div className="text-gold-500 uppercase tracking-widest text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Compass className="h-4 w-4" /> Accommodation
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">
                Exquisite Suites & Residences
              </h2>
            </div>
            <Link href="/rooms" className="group flex items-center gap-2 text-sm text-gold-600 hover:text-gold-500 font-semibold transition-colors mt-4 md:mt-0">
              View All Accommodations <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingRooms ? (
            <div className="flex justify-center py-20 gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-5 w-5 animate-spin text-gold-500" /> Loading featured residences...
            </div>
          ) : featuredRooms.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-amber-500/5 dark:bg-amber-500/5 border border-gold-500/25 p-8 max-w-2xl mx-auto shadow-sm">
              <Compass className="h-12 w-12 text-gold-500 mx-auto mb-4 animate-pulse" />
              <h3 className="font-display font-bold text-xl text-foreground mb-2">No Rooms Available For Now</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed font-light">
                All suites and residences are currently undergoing seasonal preparation or are fully reserved. Please contact our 24/7 concierge service or check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredRooms.map((room, idx) => {
                const imageUrl = room.image_url || FALLBACK_ROOM_IMAGES[idx % FALLBACK_ROOM_IMAGES.length];
                const hotelName = room.hotels?.name || "Grand Azure";

                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className="luxury-card overflow-hidden flex flex-col h-full bg-white dark:bg-charcoal-900 border border-border/40"
                  >
                    <div className="relative h-72 overflow-hidden bg-muted">
                      <img
                        src={imageUrl}
                        alt={room.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 right-4 bg-navy-950/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
                        From PHP {Number(room.base_price).toLocaleString()}/night
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase block mb-1">
                          {hotelName}
                        </span>
                        <h3 className="text-xl font-display font-semibold text-foreground mb-3">{room.name}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-light">{room.description || "Luxury custom suite configurations."}</p>
                      </div>
                      <Link href={`/booking?hotelId=${room.hotel_id}&roomTypeId=${room.id}`} className="w-full">
                        <Button variant="outline" className="w-full rounded-xl hover:border-gold-500 hover:text-gold-500 transition-colors">
                          Reserve Suite
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* AMENITIES */}
      <section className="py-24 bg-white dark:bg-charcoal-900 border-y border-border/40">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-gold-500 uppercase tracking-widest text-xs font-semibold mb-2 block">
              Bespoke Luxuries
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              Indulge in Our Facilities
            </h2>
            <div className="gold-divider my-4 w-24 mx-auto" />
            <p className="text-muted-foreground text-sm font-light leading-relaxed">
              Every detail is designed to fulfill your desires, from culinary masterworks to premium in-room delights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {AMENITIES.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gold-50 dark:bg-gold-950/20 text-gold-600 dark:text-gold-400 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-base mb-1.5">{item.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed font-light">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
