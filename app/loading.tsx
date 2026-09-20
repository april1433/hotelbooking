"use client";

import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream-50/80 dark:bg-charcoal-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Luxury logo spinning/pulsing wrapper */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-navy-950 border border-gold-500/30 flex items-center justify-center font-display font-bold text-2xl text-gold-400 shadow-luxury-lg animate-pulse">
            G
          </div>
          <div className="absolute -inset-1.5 rounded-[22px] border border-gold-500/10 animate-spin-slow pointer-events-none" />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Spinner size="sm" className="text-gold-500" />
          <span className="text-xs uppercase tracking-widest font-semibold text-gold-600 dark:text-gold-400">
            Loading Azure Portal...
          </span>
        </div>
      </div>
    </div>
  );
}
