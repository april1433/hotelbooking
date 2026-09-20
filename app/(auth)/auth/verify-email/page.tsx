"use client";

import Link from "next/link";
import { Mail, ArrowRight, Shield } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-charcoal-950 px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-100/30 via-transparent to-navy-900/5 dark:from-gold-950/10 dark:to-charcoal-950/40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-navy-900 text-gold-400 flex items-center justify-center font-display font-bold text-xl shadow-luxury">
              G
            </div>
            <div className="font-display font-semibold text-xl leading-none text-navy-900 dark:text-white text-left">
              <span>Grand Azure</span>
              <div className="text-[10px] font-sans font-normal text-gold-500 tracking-widest uppercase">Hotel & Suites</div>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-widest mt-1">
            <Shield className="h-3.5 w-3.5 text-gold-500" /> Account verification
          </div>
        </div>

        <Card className="border border-border/40 bg-white/70 dark:bg-charcoal-900/70 backdrop-blur-md shadow-luxury-lg rounded-2xl overflow-hidden text-center">
          <CardHeader className="space-y-1.5 pb-6">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gold-50 dark:bg-gold-950/50 flex items-center justify-center text-gold-600 dark:text-gold-400 mb-4 border border-gold-200/20">
              <Mail className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Check your inbox</CardTitle>
            <CardDescription>
              We&apos;ve dispatched verification instructions to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed font-light">
              Click the link in the message to activate your guest or staff profile. If you don&apos;t receive it within a few minutes, check your junk folder.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-border/40 pt-6">
            <Link href="/auth/login" className="w-full">
              <Button variant="gold" size="lg" className="w-full rounded-xl font-semibold flex items-center justify-center gap-1.5">
                Proceed to login <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
