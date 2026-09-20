"use client";

import { Card } from "@/components/ui";

const AMENITIES_CATALOG = [
  {
    title: "Culinary Highlights",
    desc: "Experience fine gastronomy at our state-of-the-art restaurants.",
    items: [
      { name: "Azure Heights Rooftop Bistro", desc: "Michelin-starred outdoor restaurant pairing culinary mastery with panoramic views." },
      { name: "Lobby Golden Tea Lounge", desc: "Handcrafted afternoon tea selection, vintage whiskeys, and acoustic piano nights." },
    ]
  },
  {
    title: "Well-Being & Wellness",
    desc: "Reinvigorate your mind, body, and senses in our serene spa quarters.",
    items: [
      { name: "Therapeutic Heated Pool", desc: "Deep relaxation thermal baths, hot stone massages, and organic oil treatments." },
      { name: "Infinity Sky Pool", desc: "Rooftop infinity swimming pool with private sunbeds and sunset dining views." },
    ]
  },
  {
    title: "Business & Events",
    desc: "Top-tier presentation spaces and meetings coordination tools.",
    items: [
      { name: "Emerald Grand Ballroom", desc: "Equipped for large corporate conventions, high-profile galas, and weddings." },
      { name: "Executive boardrooms", desc: "Smart display setups, high-fidelity microphones, and tailored refreshments." },
    ]
  }
];

export default function AmenitiesPage() {
  return (
    <div className="bg-cream-50 dark:bg-charcoal-950 min-h-screen">
      
      {/* Banner */}
      <section className="relative h-[35vh] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-xs" />
        <div className="container relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-display font-bold">Premium Amenities</h1>
          <p className="text-xs uppercase tracking-widest text-gold-400 mt-3 font-semibold font-mono">Curated Comforts</p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="py-24 container mx-auto px-6 max-w-5xl space-y-16">
        {AMENITIES_CATALOG.map((cat, idx) => (
          <div key={idx} className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-semibold text-foreground">{cat.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
              <div className="gold-divider w-12 mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {cat.items.map((item, idy) => (
                <Card key={idy} className="luxury-card bg-white dark:bg-charcoal-900 border-border/40 p-6">
                  <h3 className="text-base font-semibold mb-2">{item.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>

    </div>
  );
}
