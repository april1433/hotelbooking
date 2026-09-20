"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, Phone, Mail, ChevronDown, User, LogOut, LayoutDashboard, Bed } from "lucide-react";
import { useTheme } from "next-themes";
import { PUBLIC_NAV } from "@/constants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export function PublicNavbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [brandName, setBrandName] = useState("Grand Azure");
  const [supportEmail, setSupportEmail] = useState("reservations@grandazure.com");
  const [supportPhone, setSupportPhone] = useState("+63 2 8123 4567");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthUser({ id: data.user.id, email: data.user.email });
        supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle()
          .then(({ data: profile }) => {
            if (profile) setUser(profile);
          });
      }
    });

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser({ id: session.user.id, email: session.user.email });
        supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()
          .then(({ data: profile }) => { if (profile) setUser(profile); });
      } else {
        setAuthUser(null);
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient() as any;
      try {
        const { data } = await supabase.from("settings").select("*");
        if (data && data.length > 0) {
          data.forEach((s: any) => {
            if (s.key === "brand_name") setBrandName(s.value);
            if (s.key === "support_email") setSupportEmail(s.value);
            if (s.key === "support_phone") setSupportPhone(s.value);
          });
        }
      } catch (err) {
        console.error("Failed to load settings in navbar:", err);
      }
    }
    loadSettings();
  }, []);

  const isHome = pathname === "/";

  return (
    <>
      {/* Top bar */}
      <div className="hidden lg:flex bg-navy-900 text-cream-200/70 text-xs py-2">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {supportPhone}</span>
            <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {supportEmail}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Check-in: 2:00 PM · Check-out: 12:00 PM</span>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled || !isHome
          ? "bg-white/95 dark:bg-charcoal-950/95 backdrop-blur-md shadow-luxury border-b border-border"
          : "absolute left-0 right-0 bg-transparent border-b border-white/10"
      )}>
        <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-lg transition-all",
              scrolled || !isHome ? "bg-navy-800 text-gold-400" : "bg-white/20 text-white backdrop-blur-sm"
            )}>
              {brandName[0] || "G"}
            </div>
            <div className={cn(
              "font-display font-semibold text-lg leading-none transition-colors",
              scrolled || !isHome ? "text-navy-900 dark:text-white" : "text-white"
            )}>
              <span>{brandName}</span>
              <div className="text-[10px] font-sans font-normal text-gold-500 tracking-widest uppercase">{brandName.includes("Azure") ? "Hotel & Suites" : "Property"}</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === item.href
                    ? "text-gold-500"
                    : scrolled || !isHome
                    ? "text-navy-700 hover:text-navy-900 hover:bg-navy-50 dark:text-cream-300 dark:hover:text-white dark:hover:bg-navy-800"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  scrolled || !isHome
                    ? "text-navy-700 hover:bg-navy-50 dark:text-cream-300 dark:hover:bg-navy-800"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            {(user || authUser) ? (
              user ? (
                <UserMenu user={user} scrolled={scrolled || !isHome} />
              ) : (
                // Logged in but no profile yet (seed not run) — show basic user menu
                <div className="flex items-center gap-2">
                  <Link
                    href="/"
                    className={cn(
                      "hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      scrolled || !isHome
                        ? "text-navy-700 hover:bg-navy-50 dark:text-cream-300"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <User className="h-4 w-4" />
                    {authUser?.email?.split("@")[0]}
                  </Link>
                  <button
                    onClick={async () => { const sb = createClient(); await sb.auth.signOut(); window.location.href = "/auth/login"; }}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={cn(
                    "hidden sm:flex px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    scrolled || !isHome
                      ? "text-navy-700 hover:bg-navy-50 dark:text-cream-300"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  Sign In
                </Link>
                <Link
                  href="/booking"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gold-500 hover:bg-gold-600 text-white shadow-gold transition-all duration-200"
                >
                  Book Now
                </Link>
              </>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen(!open)}
              className={cn(
                "lg:hidden p-2 rounded-lg transition-all",
                scrolled || !isHome ? "text-navy-700" : "text-white"
              )}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white dark:bg-charcoal-950 border-t border-border overflow-hidden"
            >
              <div className="container mx-auto px-6 py-4 flex flex-col gap-1">
                {PUBLIC_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      pathname === item.href
                        ? "bg-navy-50 text-navy-900 dark:bg-navy-800 dark:text-white"
                        : "text-navy-700 hover:bg-navy-50 dark:text-cream-300 dark:hover:bg-navy-800"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-border mt-2 pt-2">
                  <Link href="/auth/login" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-medium text-navy-700 hover:bg-navy-50 dark:text-cream-300">Sign In</Link>
                  <Link href="/booking" onClick={() => setOpen(false)} className="block mt-1 px-3 py-2.5 rounded-xl text-sm font-semibold text-center bg-gold-500 text-white">Book Now</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

function UserMenu({ user, scrolled }: { user: Profile; scrolled: boolean }) {
  const [open, setOpen] = useState(false);
  const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Account";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
          scrolled ? "text-navy-700 hover:bg-navy-50 dark:text-cream-300 dark:hover:bg-navy-800" : "text-white hover:bg-white/10"
        )}
      >
        <div className="w-7 h-7 rounded-full bg-navy-700 text-white flex items-center justify-center text-xs font-bold">
          {name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block">{name.split(" ")[0]}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-52 bg-white dark:bg-charcoal-900 rounded-2xl shadow-luxury-lg border border-border overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="py-1.5">
              <Link href={user.role === "guest" ? "/guest/dashboard" : "/admin/dashboard"} onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              {user.role === "guest" && (
                <Link href="/guest/reservations" onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                  <Bed className="h-4 w-4" /> My Reservations
                </Link>
              )}
              <Link href={user.role === "guest" ? "/guest/profile" : "/admin/settings"} onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                <User className="h-4 w-4" /> Profile
              </Link>
            </div>
            <div className="border-t border-border py-1.5">
              <button onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
