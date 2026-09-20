"use client";

import { Wrench, Clock } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 dark:bg-charcoal-950 px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-100/20 via-transparent to-navy-900/5 dark:from-gold-950/5 pointer-events-none" />

      <div className="max-w-md relative z-10">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-gold-50 dark:bg-gold-950/30 flex items-center justify-center text-gold-600 dark:text-gold-400 mb-8 border border-gold-200/20">
          <Wrench className="h-8 w-8 animate-bounce" />
        </div>

        <h1 className="text-4xl font-display font-bold text-foreground mb-4">Under Maintenance</h1>
        <p className="text-muted-foreground text-sm font-light leading-relaxed mb-6">
          We are currently performing scheduled maintenance to upgrade our reservation engine and hotel systems.
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-50 dark:bg-navy-900/40 text-navy-800 dark:text-cream-200 text-xs font-medium border border-navy-100 dark:border-navy-800">
          <Clock className="h-3.5 w-3.5 text-gold-500" /> Estimated restoration time: 10 mins
        </div>
      </div>
    </div>
  );
}
