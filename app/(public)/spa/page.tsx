"use client";

import { Card, CardContent } from "@/components/ui";
import { Sparkles, Activity, ShieldCheck } from "lucide-react";

const TREATMENTS = [
  { name: "Himalayan Salt Stone Massage", duration: "90 Mins", price: 4500, desc: "Warmed salt crystal stones massage deep tissues, replenishing natural minerals and easing muscle tensions." },
  { name: "Organic Essential Oil Facial", duration: "60 Mins", price: 3200, desc: "A custom facial treatment using botanical hydrosols, clarifying masks, and anti-aging jade rolling." },
  { name: "Hydrotherapy Jet Baths", duration: "45 Mins", price: 2500, desc: "Soaking bath infused with therapeutic salts and high-powered targeted underwater jets to revive circulation." },
];

export default function SpaPage() {
  return (
    <div className="bg-cream-50 dark:bg-charcoal-950 min-h-screen">
      {/* Banner */}
      <section className="relative h-[35vh] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2000')" }}>
        <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-xs" />
        <div className="container relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-display font-bold">Wellness Spa Sanctuary</h1>
          <p className="text-xs uppercase tracking-widest text-gold-400 mt-3 font-semibold font-mono">Bespoke Therapies</p>
        </div>
      </section>

      {/* Spa Content */}
      <section className="py-24 container mx-auto px-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 text-center">
          {[
            { icon: Sparkles, title: "Rejuvenating Ambience", desc: "A sensory retreat featuring soft warm lighting, aromatherapy scents, and ambient relaxation tracks." },
            { icon: Activity, title: "Expert Therapists", desc: "Our certified practitioners design personalized schedules to realign posture and relieve fatigue." },
            { icon: ShieldCheck, title: "Thermal Facilities", desc: "Complimentary access to cedar wood steam saunas, herbal inhalation chambers, and pools." },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-gold-50 dark:bg-gold-950/30 text-gold-600 flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base mb-2">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Treatments Menu */}
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto mb-10">
            <h2 className="text-2xl font-display font-semibold">Treatment Menu</h2>
            <p className="text-xs text-muted-foreground mt-1">Pre-book your treatment slot via the guest console.</p>
            <div className="gold-divider w-16 mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {TREATMENTS.map((t, idx) => (
              <Card key={idx} className="luxury-card bg-white dark:bg-charcoal-900 border-border/40 hover:shadow-luxury transition-all duration-300">
                <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm">{t.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-light max-w-2xl">{t.desc}</p>
                  </div>
                  <div className="flex sm:flex-col items-end gap-2 sm:gap-1 shrink-0 self-stretch sm:self-auto justify-between border-t sm:border-0 pt-3 sm:pt-0 border-border/40">
                    <span className="text-xs text-muted-foreground">{t.duration}</span>
                    <span className="text-sm font-bold text-gold-600">PHP {t.price.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
