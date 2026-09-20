"use client";

import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 dark:bg-charcoal-950 px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-100/20 via-transparent to-navy-900/5 dark:from-gold-950/5 pointer-events-none" />

      <div className="max-w-md relative z-10">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-gold-50 dark:bg-gold-950/30 flex items-center justify-center text-gold-600 dark:text-gold-400 mb-8 border border-gold-200/20 animate-spin-slow">
          <Compass className="h-8 w-8" />
        </div>

        <h1 className="text-4xl font-display font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-4">Suite Not Found</h2>
        <p className="text-muted-foreground text-sm font-light leading-relaxed mb-12">
          The page you are looking for has been moved, renamed, or is currently unavailable. Let&apos;s redirect you back to luxury.
        </p>

        <Link href="/">
          <Button variant="gold" className="rounded-xl px-8 shadow-gold">
            <Home className="h-4 w-4 mr-2" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
