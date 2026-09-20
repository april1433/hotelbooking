/**
 * create-superadmin.mjs  (v2 — handles RLS by using REST upsert with service role)
 * Run: node create-superadmin.mjs <SERVICE_ROLE_KEY>
 *
 * Usage:
 *   node create-superadmin.mjs eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * The SERVICE_ROLE_KEY is the long eyJ... JWT from:
 *   https://supabase.com/dashboard/project/flzbtfpylaqchrjyvxod/settings/api
 *   (labeled "service_role" — NOT the anon/publishable key)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://flzbtfpylaqchrjyvxod.supabase.co";
const SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_ROLE_KEY || !SERVICE_ROLE_KEY.startsWith("eyJ")) {
  console.error(`
❌  Missing or invalid SERVICE_ROLE_KEY.

Usage:  node create-superadmin.mjs <SERVICE_ROLE_KEY>

Get it from:
  https://supabase.com/dashboard/project/flzbtfpylaqchrjyvxod/settings/api
  → Copy the "service_role" key (starts with eyJ...)
`);
  process.exit(1);
}

const SUPER_EMAIL    = "super@grandazure.com";
const SUPER_PASSWORD = "123123";
const HOTEL_ID       = "11111111-0000-0000-0000-000000000001";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run(label, fn) {
  process.stdout.write(`  ${label}... `);
  try {
    await fn();
    console.log("✅");
  } catch (err) {
    console.log(`❌  ${err.message}`);
    throw err;
  }
}

console.log("\n╔═══════════════════════════════════════════╗");
console.log("║   Grand Azure — Super Admin Setup  v2    ║");
console.log("╚═══════════════════════════════════════════╝\n");

// ── Verify connectivity ───────────────────────────────────────────────────────
await run("Verify auth API", async () => {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: SERVICE_ROLE_KEY } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
});

// ── Upsert hotel ──────────────────────────────────────────────────────────────
await run("Seed hotel row", async () => {
  const { error } = await supabase.from("hotels").upsert({
    id: HOTEL_ID,
    name: "Grand Azure Hotel & Resort",
    slug: "grand-azure-hotel",
    description: "A premier luxury resort offering world-class amenities.",
    address: "123 Seaside Boulevard, Resort Zone",
    city: "Boracay",
    state: "Aklan",
    country: "Philippines",
    phone: "+63 36 288 1234",
    email: "info@grandazure.com",
    star_rating: 5,
    currency: "PHP",
    timezone: "Asia/Manila",
    is_active: true,
  }, { onConflict: "id" });
  if (error) throw new Error(error.message);
});

// ── Create or update auth user ────────────────────────────────────────────────
let userId;
await run("Create / update auth user", async () => {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find(u => u.email === SUPER_EMAIL);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: SUPER_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: "Super", last_name: "Admin", role: "super_admin" },
    });
    if (error) throw new Error(error.message);
    userId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: SUPER_EMAIL,
      password: SUPER_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: "Super", last_name: "Admin", role: "super_admin" },
    });
    if (error) throw new Error(error.message);
    userId = data.user.id;
  }
});

// ── Upsert profile ────────────────────────────────────────────────────────────
await run("Upsert super_admin profile", async () => {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    hotel_id: HOTEL_ID,
    role: "super_admin",
    first_name: "Super",
    last_name: "Admin",
    display_name: "Super Admin",
    email: SUPER_EMAIL,
    is_active: true,
  }, { onConflict: "id" });
  if (error) throw new Error(error.message);
});

console.log(`
─────────────────────────────────────────────
  ✅  Done! Login credentials:

  Email    : super  (shortcut) or ${SUPER_EMAIL}
  Password : ${SUPER_PASSWORD}
  Role     : super_admin

  → http://localhost:3000/auth/login
─────────────────────────────────────────────
`);
