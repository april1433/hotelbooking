"use client";

import { Card, CardContent } from "@/components/ui";
import { UtensilsCrossed, Wine, Coffee } from "lucide-react";

const VENUES = [
  {
    name: "Azure Heights Rooftop Bistro",
    type: "Fine Dining & Grill",
    desc: "Michelin-starred open-air rooftop culinary experience. Combining contemporary French techniques with fresh locally-sourced seafood and prime dry-aged steaks.",
    hours: "6:00 PM – 11:00 PM (Reservation Required)",
    icon: UtensilsCrossed,
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800"
  },
  {
    name: "Lobby Golden Tea Lounge",
    type: "Teahouse & Spirits Bar",
    desc: "Elegant atrium serving premium single-estate afternoon tea leaves, gourmet light bites, and transitioning to a sophisticated whiskey and cocktail lounge by night.",
    hours: "9:00 AM – 12:00 AM (Walk-in Welcomed)",
    icon: Wine,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800"
  },
];

export default function RestaurantPage() {
  return (
    <div className="bg-cream-50 dark:bg-charcoal-950 min-h-screen">
      {/* Banner */}
      <section className="relative h-[35vh] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2000')" }}>
        <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-xs" />
        <div className="container relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-display font-bold">Culinary Mastery</h1>
          <p className="text-xs uppercase tracking-widest text-gold-400 mt-3 font-semibold font-mono">Fine Dining Venues</p>
        </div>
      </section>

      {/* Venues Grid */}
      <section className="py-24 container mx-auto px-6 max-w-5xl space-y-12">
        {VENUES.map((venue, idx) => {
          const Icon = venue.icon;
          return (
            <Card key={idx} className="luxury-card overflow-hidden bg-white dark:bg-charcoal-900 border-border/40">
              <CardContent className="p-0 flex flex-col md:flex-row">
                <div className="w-full md:w-96 h-64 md:h-auto shrink-0 relative overflow-hidden">
                  <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-8 flex flex-col justify-between flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gold-50 dark:bg-gold-950/30 text-gold-600 flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs text-gold-600 font-bold uppercase tracking-wider font-mono">{venue.type}</span>
                    </div>
                    <h2 className="text-2xl font-display font-bold text-foreground">{venue.name}</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed font-light">{venue.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/40 text-xs text-muted-foreground flex justify-between items-center">
                    <span>Operating Hours:</span>
                    <span className="font-semibold text-foreground">{venue.hours}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
