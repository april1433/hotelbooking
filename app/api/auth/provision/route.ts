/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const HOTEL_ID = "11111111-0000-0000-0000-000000000001";

// Email → role mapping for default staff accounts
const EMAIL_ROLE_MAP: Record<string, string> = {
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

const ROLE_NAMES: Record<string, { first: string; last: string }> = {
  "super@grandazure.com": { first: "Super", last: "Admin" },
  "admin2@grandazure.com": { first: "System", last: "Admin" },
  "admin@grandazure.com": { first: "Hotel", last: "Admin" },
  "manager@grandazure.com": { first: "Maria", last: "Santos" },
  "reception@grandazure.com": { first: "Juan", last: "Dela Cruz" },
  "housekeeping@grandazure.com": { first: "Elena", last: "Reyes" },
  "cashier@grandazure.com": { first: "Carlos", last: "Mendoza" },
  "maintenance@grandazure.com": { first: "Ramon", last: "Bautista" },
  "guest@grandazure.com": { first: "Sofia", last: "Garcia" },
};

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "No database configured" }, { status: 503 });
    }

    const supabase = createServerClient(supabaseUrl, serviceKey, {
      cookies: { getAll() { return []; }, setAll() {} },
    }) as any;

    // 1. Check if profile already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ role: existing.role, created: false });
    }

    // 2. Determine role from email
    const emailLower = email.toLowerCase();
    const role = EMAIL_ROLE_MAP[emailLower] ||
      (emailLower.endsWith("@grandazure.com") ? "guest" : "guest");

    // 3. Determine name
    const nameInfo = ROLE_NAMES[emailLower];
    const firstName = nameInfo?.first || email.split("@")[0];
    const lastName = nameInfo?.last || "";
    const displayName = nameInfo ? `${nameInfo.first} ${nameInfo.last}`.trim() : email.split("@")[0];

    // 4. Ensure hotel exists first
    await supabase
      .from("hotels")
      .upsert({
        id: HOTEL_ID,
        name: "Grand Azure Hotel & Resort",
        slug: "grand-azure-hotel",
        address: "123 Seaside Boulevard, Resort Zone",
        city: "Boracay",
        country: "Philippines",
        phone: "+63 36 288 1234",
        email: "info@grandazure.com",
        is_active: true,
      }, { onConflict: "id" });

    // 5. Create profile
    const { data: newProfile, error: profileErr } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        hotel_id: HOTEL_ID,
        role,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        email: email,
        is_active: true,
      })
      .select("id, role")
      .single();

    if (profileErr) {
      console.error("Profile creation error:", profileErr);
      // If it's a duplicate, fetch the existing one
      if (profileErr.code === "23505") {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", userId)
          .single();
        return NextResponse.json({ role: existingProfile?.role || role, created: false });
      }
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({ role: newProfile.role, created: true });
  } catch (err: any) {
    console.error("Provision error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
