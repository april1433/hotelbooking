"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, LogOut, Settings, Moon, Sun,
  LayoutDashboard, CalendarDays, BedDouble, Users, Wrench,
  Sparkles, Package, CreditCard, BarChart3, TrendingUp,
  ShieldCheck, UserCog, ClipboardList, CheckSquare, History,
  ClipboardCheck, LogIn, LogOut as CheckOut, UserPlus, Receipt, Star, User, Bell, Home
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, CalendarDays, BedDouble, Users, Wrench,
  Sparkles, Package, CreditCard, BarChart3, TrendingUp,
  ShieldCheck, UserCog, ClipboardList, CheckSquare, History,
  ClipboardCheck, LogIn, LogOut: CheckOut, UserPlus, Receipt, Star, User, Bell, Settings,
};

interface NavItem { label: string; href: string; icon: string; }

interface SidebarProps {
  navItems: NavItem[];
  user: Profile;
  title?: string;
}

export function Sidebar({ navItems, user, title }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [brandName, setBrandName] = useState("Grand Azure");

  useEffect(() => {
    async function loadBrandName() {
      const supabase = createClient() as any;
      try {
        const { data } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "brand_name")
          .maybeSingle();
        if (data?.value) {
          setBrandName(data.value);
        }
      } catch (err) {
        console.error("Failed to load brand name:", err);
      }
    }
    loadBrandName();
  }, []);

  const displayName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "User";
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden shrink-0"
    >
      {/* Header */}
      <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border shrink-0", collapsed ? "justify-center" : "gap-3")}>
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 border border-sidebar-primary/30 flex items-center justify-center shrink-0">
          <span className="text-sidebar-primary font-display font-bold text-base">{brandName[0] || "G"}</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden">
              <div className="text-sidebar-foreground font-display font-semibold text-sm leading-none truncate">{brandName}</div>
              <div className="text-sidebar-primary/60 text-[9px] tracking-widest uppercase font-sans">{title ?? "Management"}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-none">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "sidebar-item",
                  active && "active",
                  collapsed && "justify-center px-0"
                )}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm truncate">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        {/* Back to Landing Page */}
        <Link
          href="/"
          className={cn("sidebar-item w-full", collapsed && "justify-center px-0")}
        >
          <Home className="h-4 w-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm">
                Back to Home
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn("sidebar-item w-full", collapsed && "justify-center px-0")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>



        {/* User card */}
        <div className={cn("flex items-center gap-2.5 mt-2 pt-2 border-t border-sidebar-border px-2", collapsed && "justify-center px-0")}>
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/30 text-sidebar-primary flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-sidebar-foreground/40 capitalize truncate">{user.role?.replace("_", " ")}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={handleSignOut}
                className="text-sidebar-foreground/40 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground flex items-center justify-center shadow-sm transition-all z-10"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </motion.aside>
  );
}
