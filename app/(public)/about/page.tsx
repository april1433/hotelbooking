"use client";

import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="bg-cream-50 dark:bg-charcoal-950 min-h-screen">
      
      {/* Subpage Banner */}
      <section className="relative h-[40vh] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-xs" />
        <div className="container relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-display font-bold">Our Heritage</h1>
          <p className="text-xs uppercase tracking-widest text-gold-400 mt-3 font-semibold font-mono">Grand Azure Story</p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-24 container mx-auto px-6 max-w-4xl text-center space-y-8">
        <span className="text-gold-500 uppercase tracking-widest text-xs font-semibold block">Founded 1994</span>
        <h2 className="text-3xl md:text-5xl font-display font-semibold text-foreground">Decades of Bespoke Comfort</h2>
        <div className="gold-divider w-24 mx-auto" />
        <p className="text-muted-foreground text-base leading-relaxed font-light">
          Grand Azure Hotel was founded with a singular ambition: to design an estate where guests could experience luxury hospitality in its purest form. Every block of marble, custom chandelier, and personalized amenity is crafted with meticulous attention to detail.
        </p>
        <p className="text-muted-foreground text-base leading-relaxed font-light">
          Our legacy is built on the satisfaction of our guests. Year after year, we strive to exceed the expectations of travelers seeking refined design, fine dining, and rejuvenating wellness retreats.
        </p>
      </section>

      {/* Statistics/Accolades section */}
      <section className="py-20 bg-white dark:bg-charcoal-900 border-y border-border/40">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "30+", label: "Years of Excellence" },
            { value: "120+", label: "World-Class Staff" },
            { value: "50", label: "Premium Suites" },
            { value: "5-Star", label: "Forbes Classification" },
          ].map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="text-3xl md:text-5xl font-display font-bold text-gold-500 mb-2">{stat.value}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>
      
    </div>
  );
}
