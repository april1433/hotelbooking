/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Shield, Lock, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      toast.success("Successfully updated password!");
      router.push("/auth/login");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred while resetting your password.");
    } finally {
      setLoading(false);
    }
  }

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
            <Shield className="h-3.5 w-3.5 text-gold-500" /> Secure reset
          </div>
        </div>

        <Card className="border border-border/40 bg-white/70 dark:bg-charcoal-900/70 backdrop-blur-md shadow-luxury-lg rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Please enter your new password below to secure your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button variant="gold" size="lg" className="w-full mt-6 rounded-xl font-semibold" loading={loading}>
                Save Password
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-6">
            <Link href="/auth/login" className="text-xs text-muted-foreground hover:text-gold-500 flex items-center gap-1.5 font-medium transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Cancel reset
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
