/**
 * reset-hotel-data.mjs
 * 
 * Clears all guest bookings, reservations, payments, and guest profiles
 * so the hotel starts fresh. Keeps only admin/super_admin staff accounts.
 * 
 * Run with: node scripts/reset-hotel-data.mjs
 */

const BASE_URL = "http://localhost:3000/api/supabase/rest/v1";
const KEY = "local_service_role_key";
const HEADERS = {
  "Content-Type": "application/json",
  "apikey": KEY,
  "Authorization": `Bearer ${KEY}`,
  "Prefer": "return=representation",
};

async function query(table, method = "GET", params = "", body = null) {
  const url = `${BASE_URL}/${table}${params ? "?" + params : ""}`;
  const opts = { method, headers: HEADERS };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: text };
  }
}

async function deleteAll(table, condition = "id=neq.00000000-0000-0000-0000-000000000000") {
  const res = await query(table, "DELETE", condition);
  if (!res.ok) {
    console.error(`  ✗ Failed to delete from ${table}:`, res.data);
  } else {
    console.log(`  ✓ Cleared: ${table}`);
  }
}

async function countRows(table) {
  const res = await query(table, "GET", "select=id");
  if (res.ok && Array.isArray(res.data)) return res.data.length;
  return "?";
}

async function main() {
  console.log("🏨 Hotel PMS — Data Reset Tool");
  console.log("================================\n");

  // Check server is running
  try {
    await fetch("http://localhost:3000");
  } catch {
    console.error("❌ Server is not running! Start the dev server first with: npm run dev");
    process.exit(1);
  }

  // Show current counts
  console.log("📊 Current data in database:");
  const tables = ["reservations", "payments", "guests", "profiles", "notifications"];
  for (const t of tables) {
    const count = await countRows(t);
    console.log(`  ${t}: ${count} rows`);
  }

  console.log("\n🗑️  Clearing transactional data...");

  // Clear in dependency order (foreign keys):
  // 1. notifications first (references reservations/profiles)
  await deleteAll("notifications");
  
  // 2. payments (references reservations)
  await deleteAll("payments");
  
  // 3. reservations (references guests, rooms)
  await deleteAll("reservations");
  
  // 4. guests
  await deleteAll("guests");

  // 5. Remove non-admin profiles (guest role)
  console.log("\n👤 Removing guest user profiles (keeping admin/super_admin)...");
  const removeGuestProfiles = await query(
    "profiles",
    "DELETE",
    "role=eq.guest"
  );
  if (removeGuestProfiles.ok) {
    console.log("  ✓ Guest profiles removed");
  } else {
    console.error("  ✗ Could not remove guest profiles:", removeGuestProfiles.data);
  }

  // 6. Reset room statuses to available
  console.log("\n🛏️  Resetting all rooms to 'available'...");
  const resetRooms = await query("rooms", "PATCH", "is_active=eq.true", {
    status: "available",
    cleaning_status: "clean",
  });
  if (resetRooms.ok) {
    console.log("  ✓ All rooms reset to available/clean");
  } else {
    console.error("  ✗ Could not reset rooms:", resetRooms.data);
  }

  // Verify final state
  console.log("\n✅ Final database state:");
  for (const t of tables) {
    const count = await countRows(t);
    console.log(`  ${t}: ${count} rows`);
  }
  const roomsCount = await countRows("rooms");
  console.log(`  rooms: ${roomsCount} rows (all available)`);

  // Check remaining profiles
  const profilesRes = await query("profiles", "GET", "select=email,role");
  if (profilesRes.ok && Array.isArray(profilesRes.data)) {
    console.log("\n👥 Remaining user accounts:");
    for (const p of profilesRes.data) {
      console.log(`  ${p.email} (${p.role})`);
    }
  }

  console.log("\n🎉 Hotel reset complete! The system is ready for new bookings.");
}

main().catch(console.error);
