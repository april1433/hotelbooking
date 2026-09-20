/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirectTo") || "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Fetch user profile to see if they are guest or staff and redirect appropriately
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        const profile = profileData as any;
        
        if (profile?.role && profile.role !== "guest") {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        } else if (profile?.role === "guest") {
          return NextResponse.redirect(new URL("/guest/dashboard", request.url));
        }
      }
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  // Return the user to an error page or homepage if things go wrong
  return NextResponse.redirect(new URL("/auth/login?error=InvalidAuthCode", request.url));
}
