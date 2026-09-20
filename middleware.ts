/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase.types";

// Role-based route protection map
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/guest":       ["guest", "receptionist", "cashier", "manager", "super_admin"],
  "/staff/reception": ["receptionist", "manager", "super_admin"],
  "/staff/housekeeping": ["housekeeping", "manager", "super_admin"],
  "/staff/maintenance":  ["maintenance", "manager", "super_admin"],
  "/staff/cashier":      ["cashier", "manager", "super_admin"],
  "/admin":       ["manager", "super_admin"],
  "/dev":         ["super_admin"],
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Dev module: allow in development OR super_admin ──
  if (pathname.startsWith("/dev")) {
    if (process.env.NODE_ENV === "development") {
      return supabaseResponse; // open in dev
    }
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const profile = profileData as any;

    if (profile?.role !== "super_admin") {
      return NextResponse.redirect(new URL("/403", request.url));
    }
    return supabaseResponse;
  }

  // ── Auth pages: redirect logged-in users to home ──
  const isAuthPage = pathname.startsWith("/auth/") && !pathname.startsWith("/auth/callback");
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── Allow auth pages and API routes through without login ──
  if (
    isAuthPage ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/callback")
  ) {
    return supabaseResponse;
  }

  // ── GLOBAL LOCK: Every other page requires login ──
  if (!user) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ── Role-based access for specific sections ──
  const protectedEntry = Object.entries(PROTECTED_ROUTES).find(([route]) =>
    pathname.startsWith(route)
  );

  if (protectedEntry) {
    const [, allowedRoles] = protectedEntry;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const profile = profileData as any;

    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
