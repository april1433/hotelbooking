"use client";

import { useState } from "react";
import { GALLERY_CATEGORIES } from "@/constants";

const GALLERY_IMAGES = [
  { src: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800", cat: "exterior", title: "Palace Exterior at Dusk" },
  { src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800", cat: "pool", title: "Rooftop Infinity Pool" },
  { src: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=800", cat: "rooms", title: "Deluxe King Terrace Room" },
  { src: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800", cat: "rooms", title: "Azure Presidential Suite Lounge" },
  { src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800", cat: "rooms", title: "Executive Golden Suite Bedroom" },
  { src: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800", cat: "rooms", title: "Deluxe Garden Suite Bathroom" },
  { src: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800", cat: "restaurant", title: "Michelin Fine Dining Hall" },
  { src: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800", cat: "restaurant", title: "Lobby Golden Tea Lounge" },
  { src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800", cat: "spa", title: "Heated Thermal Pools" },
  { src: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=800", cat: "spa", title: "Relaxation Treatment Chambers" },
  { src: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800", cat: "events", title: "Emerald Grand Ballroom" },
  { src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800", cat: "lobby", title: "Sleek Welcome Foyer" },
];

export default function GalleryPage() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? GALLERY_IMAGES : GALLERY_IMAGES.filter(img => img.cat === filter);

  return (
    <div className="bg-cream-50 dark:bg-charcoal-950 min-h-screen">
      {/* Banner */}
      <section className="relative h-[35vh] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000')" }}>
        <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-xs" />
        <div className="container relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-display font-bold">Resort Photo Gallery</h1>
          <p className="text-xs uppercase tracking-widest text-gold-400 mt-3 font-semibold font-mono">Visual Experience</p>
        </div>
      </section>

      {/* Grid section */}
      <section className="py-20 container mx-auto px-6 max-w-6xl">
        <div className="flex gap-2 flex-wrap justify-center mb-12">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 text-xs rounded-full border font-medium transition-all ${filter === "all" ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}
          >
            All Spaces
          </button>
          {GALLERY_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`px-4 py-1.5 text-xs rounded-full border font-medium transition-all ${filter === cat.value ? "bg-navy-800 text-white border-navy-800" : "border-border/60 text-muted-foreground hover:border-navy-400"}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((img, i) => (
            <div key={i} className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-luxury transition-all duration-500 bg-white">
              <div className="h-64 overflow-hidden relative">
                <img src={img.src} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-sm font-semibold font-display">{img.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
