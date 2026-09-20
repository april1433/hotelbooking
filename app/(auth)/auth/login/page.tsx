/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Shield, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    let resolvedEmail = email.trim();
    if (resolvedEmail.toLowerCase() === "admin") {
      resolvedEmail = "admin@grandazure.com";
    } else if (resolvedEmail.toLowerCase() === "super") {
      resolvedEmail = "super@grandazure.com";
    } else if (resolvedEmail.toLowerCase() === "guest") {
      resolvedEmail = "guest@grandazure.com";
    }

    setLoading(true);

    try {
      if (isMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email: resolvedEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
          },
        });

        if (error) throw error;
        toast.success("Magic link sent! Please check your email inbox.");
      } else {
        if (!password) {
          toast.error("Please enter your password.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password,
        });

        if (error) throw error;
        toast.success("Successfully logged in!");
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-charcoal-950 px-6 py-12 relative overflow-hidden">
      
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-100/30 via-transparent to-navy-900/5 dark:from-gold-950/10 dark:to-charcoal-950/40 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-gold-400/5 rounded-full blur-[100px] -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-navy-500/5 rounded-full blur-[100px] -bottom-20 -right-20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Logo Header */}
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
            <Shield className="h-3.5 w-3.5 text-gold-500" /> Secure Portal login
          </div>
        </div>

        {/* Card wrapper */}
        <Card className="border border-border/40 bg-white/70 dark:bg-charcoal-900/70 backdrop-blur-md shadow-luxury-lg rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle className="text-2xl text-center">
              {isMagicLink ? "Sign In with Magic Link" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-center">
              {isMagicLink 
                ? "Enter your email to receive a passwordless login link." 
                : "Sign in to manage bookings, track schedules, and more."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              {!isMagicLink && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Password
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-gold-600 hover:text-gold-500 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 rounded-xl"
                      required={!isMagicLink}
                    />
                  </div>
                </div>
              )}

              <Button variant="gold" size="lg" className="w-full mt-6 rounded-xl font-semibold" loading={loading}>
                {isMagicLink ? "Send Magic Link" : "Sign In with Password"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-border/40 pt-6">
            <button
              onClick={() => setIsMagicLink(!isMagicLink)}
              className="text-sm text-navy-800 dark:text-cream-200 hover:text-gold-500 dark:hover:text-gold-400 font-medium transition-colors"
            >
              {isMagicLink ? "Use password instead" : "Use passwordless Magic Link"}
            </button>
            <div className="text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-gold-600 hover:text-gold-500 font-medium transition-colors">
                Create guest account
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
