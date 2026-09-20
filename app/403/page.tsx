"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 dark:bg-charcoal-950 px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-100/20 via-transparent to-navy-900/5 dark:from-gold-950/5 pointer-events-none" />

      <div className="max-w-md relative z-10">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-8 border border-red-200/20 animate-bounce">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="text-4xl font-display font-bold text-foreground mb-4">Access Denied</h1>
        <p className="text-muted-foreground text-sm font-light leading-relaxed mb-12">
          Your profile does not hold the permissions required to view this module. Please contact the Hotel Admin if you believe this is a mistake.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" className="rounded-xl px-6" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
          <Link href="/">
            <Button variant="gold" className="rounded-xl px-6">
              <Home className="h-4 w-4 mr-2" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
