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

  // ── Allow public hotel pages, auth pages, and API routes through without login ──
  const PUBLIC_ROUTES = [
    "/",
    "/rooms",
    "/about",
    "/contact",
    "/amenities",
    "/gallery",
    "/restaurant",
    "/spa",
    "/booking",
    "/checkout",
    "/403",
    "/maintenance",
  ];

  const isPublicPage = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (
    isPublicPage ||
    isAuthPage ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/callback")
  ) {
    return supabaseResponse;
  }

  // ── Protected areas require login ──
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
      .maybeSingle();

    let role = (profileData as any)?.role;

    // Fallback: derive role from email if profile doesn't exist yet
    if (!role && user.email) {
      const emailMap: Record<string, string> = {
        "super@grandazure.com": "super_admin",
        "admin@grandazure.com": "super_admin",
        "admin2@grandazure.com": "super_admin",
        "manager@grandazure.com": "manager",
        "reception@grandazure.com": "receptionist",
        "housekeeping@grandazure.com": "housekeeping",
        "cashier@grandazure.com": "cashier",
        "maintenance@grandazure.com": "maintenance",
        "guest@grandazure.com": "guest",
      };
      role = emailMap[user.email.toLowerCase()] ||
        (user.email.endsWith("@grandazure.com") ? "guest" : undefined);
    }

    if (!role) {
      if (pathname.startsWith("/guest")) {
        role = "guest";
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    if (!allowedRoles.includes(role)) {
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
