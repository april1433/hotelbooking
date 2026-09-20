"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 dark:bg-charcoal-950 px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-100/20 via-transparent to-navy-900/5 dark:from-gold-950/5 pointer-events-none" />

      <div className="max-w-md relative z-10">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-8 border border-red-200/20">
          <AlertCircle className="h-8 w-8 animate-pulse" />
        </div>

        <h1 className="text-4xl font-display font-bold text-foreground mb-2">500</h1>
        <h2 className="text-xl font-semibold text-foreground mb-4">Something Went Wrong</h2>
        <p className="text-muted-foreground text-sm font-light leading-relaxed mb-12">
          An unexpected server-side error occurred. The system logs have been updated automatically. Please try reloading the interface.
        </p>

        <Button variant="gold" className="rounded-xl px-8 shadow-gold" onClick={() => reset()}>
          <RotateCcw className="h-4 w-4 mr-2" /> Reload Application
        </Button>
      </div>
    </div>
  );
}
