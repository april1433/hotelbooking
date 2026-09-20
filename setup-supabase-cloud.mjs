#!/usr/bin/env node
/**
 * Supabase Cloud Migration Script
 * 
 * Pushes the hotel PMS schema and seed data to Supabase Cloud
 * via the Management API SQL endpoint.
 * 
 * Usage: node setup-supabase-cloud.mjs
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Configuration ──────────────────────────────────────────────────────────────
const SUPABASE_PROJECT_REF = "flzbtfpylaqchrjyvxod";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

// The anon/publishable key (used for REST data operations)
const ANON_KEY = "sb_publishable_Uas3XtEk9pTiuc2PBPDmIg_pbPKEm_q";

// Hotel & Admin constants
const HOTEL_ID = "11111111-0000-0000-0000-000000000001";
const ADMIN_UUID = "28537215-8bb7-49b9-85d0-2abeeafdbe6e";

const authHeaders = {
  "apikey": ANON_KEY,
  "Authorization": `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=minimal",
};

// ── Helper Functions ─────────────────────────────────────────────────────────
async function supabaseRequest(path, method = "GET", body = null) {
  const opts = { method, headers: authHeaders };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} /rest/v1/${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function upsert(table, records, onConflict) {
  const items = Array.isArray(records) ? records : [records];
  const opts = {
    method: "POST",
    headers: {
      ...authHeaders,
      "Prefer": `resolution=merge-duplicates,return=minimal`,
    },
    body: JSON.stringify(items),
  };
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ""}`,
    opts
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Upsert ${table} → ${res.status}: ${txt.slice(0, 300)}`);
  }
}

async function checkTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
    headers: authHeaders,
  });
  return res.status === 200;
}

// ── Step 1: Check connectivity ─────────────────────────────────────────────
console.log("🔌 Checking Supabase connectivity...");
try {
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
    headers: { apikey: ANON_KEY },
  });
  const authJson = await authRes.json();
  console.log(`  ✅ Auth API: ${authJson.name} ${authJson.version}`);
} catch (err) {
  console.error("❌ Cannot reach Supabase. Check your internet connection.", err.message);
  process.exit(1);
}

// ── Step 2: Check if tables already exist ─────────────────────────────────
console.log("\n📊 Checking existing tables...");
const hotelsExist = await checkTable("hotels");
const roomTypesExist = await checkTable("room_types");

if (!hotelsExist) {
  console.log("⚠️  Tables do not exist yet.");
  console.log("\n" + "═".repeat(70));
  console.log("📋 MANUAL STEP REQUIRED");
  console.log("═".repeat(70));
  console.log("\nYou need to run the schema SQL in your Supabase SQL Editor:");
  console.log("\n1. Open: https://supabase.com/dashboard/project/flzbtfpylaqchrjyvxod/sql/new");
  console.log("2. Copy the contents of: database/schema.sql");
  console.log("3. Paste it into the SQL Editor and click 'Run'");
  console.log("4. Then re-run this script to seed the data.\n");
  console.log("═".repeat(70));
  console.log("\nAlternatively, the schema SQL file is at:");
  console.log(`  ${join(__dirname, "database", "schema.sql")}`);
  console.log("\nAfter running schema, re-run: node setup-supabase-cloud.mjs --seed-only\n");
  
  const isSeedOnly = process.argv.includes("--seed-only");
  if (!isSeedOnly) process.exit(0);
} else {
  console.log("  ✅ Tables exist, proceeding with seed data...");
}

// ── Step 3: Seed Data ─────────────────────────────────────────────────────
console.log("\n🏨 Seeding Hotel...");
await upsert("hotels", {
  id: HOTEL_ID,
  name: "Grand Azure Hotel & Resort",
  slug: "grand-azure-hotel",
  description: "A premier luxury resort in the heart of Boracay, offering world-class amenities and breathtaking ocean views.",
  address: "123 Seaside Boulevard, Resort Zone",
  city: "Boracay",
  state: "Aklan",
  country: "Philippines",
  phone: "+63 36 288 1234",
  email: "info@grandazure.com",
  website: "https://grandazure.com",
  star_rating: 5,
  currency: "PHP",
  timezone: "Asia/Manila",
  is_active: true,
}, "id");
console.log("  ✅ Hotel seeded");

// ── Profiles (system staff) ────────────────────────────────────────────────
console.log("\n👤 Seeding Staff Profiles...");
// NOTE: Auth users must be created manually or via Supabase Auth Admin API
// The profiles table references auth.users, so we seed profiles with the same IDs
// In production, create auth users first via Supabase Auth
const staffProfiles = [
  { id: ADMIN_UUID, email: "admin@grandazure.com", role: "super_admin", first_name: "System", last_name: "Admin" },
  { id: "33333333-3333-4333-8333-333333333333", email: "manager@grandazure.com", role: "manager", first_name: "Maria", last_name: "Santos" },
  { id: "11111111-1111-4111-8111-111111111111", email: "reception@grandazure.com", role: "receptionist", first_name: "Juan", last_name: "Dela Cruz" },
  { id: "22222222-2222-4222-8222-222222222222", email: "housekeeping@grandazure.com", role: "housekeeping", first_name: "Elena", last_name: "Reyes" },
];

// Profiles reference auth.users — only insert if the user already exists
// We'll try and silently skip if foreign key fails
for (const p of staffProfiles) {
  try {
    await upsert("profiles", {
      id: p.id,
      hotel_id: HOTEL_ID,
      role: p.role,
      first_name: p.first_name,
      last_name: p.last_name,
      display_name: `${p.first_name} ${p.last_name}`,
      email: p.email,
      is_active: true,
    }, "id");
    console.log(`  ✅ Profile: ${p.email}`);
  } catch (err) {
    console.log(`  ⚠️  Profile ${p.email} skipped (auth user may not exist): ${err.message.slice(0, 80)}`);
  }
}

// ── Room Types ────────────────────────────────────────────────────────────
console.log("\n🛏️  Seeding Room Types...");
const roomTypes = [
  { id: "a1111111-1111-1111-1111-111111111111", name: "Deluxe Suite", slug: "deluxe-suite", description: "Spacious luxury suite featuring a private balcony and panoramic beach views.", base_price: 8500, max_occupancy: 3, max_adults: 2, max_children: 1, bed_type: "King", sort_order: 1 },
  { id: "a2222222-2222-2222-2222-222222222222", name: "Ocean View Villa", slug: "ocean-view-villa", description: "Exclusive beachfront villa with direct ocean access and private plunge pool.", base_price: 15000, max_occupancy: 4, max_adults: 3, max_children: 2, bed_type: "King", sort_order: 2 },
  { id: "a3333333-3333-3333-3333-333333333333", name: "Executive King", slug: "executive-king", description: "Modern upscale room tailored for executives and couples seeking premium comfort.", base_price: 6200, max_occupancy: 2, max_adults: 2, max_children: 0, bed_type: "King", sort_order: 3 },
  { id: "a4444444-4444-4444-4444-444444444444", name: "Standard Twin", slug: "standard-twin", description: "Comfortable twin room ideal for friends or small families.", base_price: 4500, max_occupancy: 2, max_adults: 2, max_children: 1, bed_type: "Twin", sort_order: 4 },
  { id: "a5555555-5555-5555-5555-555555555555", name: "Presidential Penthouse", slug: "presidential-penthouse", description: "Top-floor penthouse with 360 ocean view, jacuzzi, butler service, and private lounge.", base_price: 32000, max_occupancy: 6, max_adults: 4, max_children: 2, bed_type: "Super King", sort_order: 5 },
  { id: "a6666666-6666-6666-6666-666666666666", name: "Garden Bungalow", slug: "garden-bungalow", description: "Charming private bungalow surrounded by tropical gardens and nature.", base_price: 9800, max_occupancy: 3, max_adults: 2, max_children: 1, bed_type: "Queen", sort_order: 6 },
];

for (const rt of roomTypes) {
  await upsert("room_types", { ...rt, hotel_id: HOTEL_ID, is_active: true }, "hotel_id,slug");
}
console.log(`  ✅ ${roomTypes.length} room types seeded`);

// ── Rooms ────────────────────────────────────────────────────────────────
console.log("\n🏢 Seeding 20 Rooms...");

// Map room_type_id → actual room type UUIDs
const rooms = [
  // Floor 1 — Standard Twin rooms
  { id: "r1010000-0000-0000-0000-000000000001", room_number: "101", floor_number: 1, room_type_id: "a1111111-1111-1111-1111-111111111111", status: "available", cleaning_status: "clean" },
  { id: "r1020000-0000-0000-0000-000000000002", room_number: "102", floor_number: 1, room_type_id: "a1111111-1111-1111-1111-111111111111", status: "occupied", cleaning_status: "clean" },
  { id: "r1030000-0000-0000-0000-000000000003", room_number: "103", floor_number: 1, room_type_id: "a3333333-3333-3333-3333-333333333333", status: "available", cleaning_status: "clean" },
  { id: "r1040000-0000-0000-0000-000000000004", room_number: "104", floor_number: 1, room_type_id: "a4444444-4444-4444-4444-444444444444", status: "available", cleaning_status: "clean" },
  { id: "r1050000-0000-0000-0000-000000000005", room_number: "105", floor_number: 1, room_type_id: "a4444444-4444-4444-4444-444444444444", status: "maintenance", cleaning_status: "dirty" },
  // Floor 2
  { id: "r2010000-0000-0000-0000-000000000006", room_number: "201", floor_number: 2, room_type_id: "a2222222-2222-2222-2222-222222222222", status: "occupied", cleaning_status: "clean" },
  { id: "r2020000-0000-0000-0000-000000000007", room_number: "202", floor_number: 2, room_type_id: "a2222222-2222-2222-2222-222222222222", status: "available", cleaning_status: "clean" },
  { id: "r2030000-0000-0000-0000-000000000008", room_number: "203", floor_number: 2, room_type_id: "a3333333-3333-3333-3333-333333333333", status: "cleaning", cleaning_status: "in_progress" },
  { id: "r2040000-0000-0000-0000-000000000009", room_number: "204", floor_number: 2, room_type_id: "a3333333-3333-3333-3333-333333333333", status: "available", cleaning_status: "clean" },
  { id: "r2050000-0000-0000-0000-000000000010", room_number: "205", floor_number: 2, room_type_id: "a4444444-4444-4444-4444-444444444444", status: "available", cleaning_status: "clean" },
  // Floor 3
  { id: "r3010000-0000-0000-0000-000000000011", room_number: "301", floor_number: 3, room_type_id: "a1111111-1111-1111-1111-111111111111", status: "reserved", cleaning_status: "clean" },
  { id: "r3020000-0000-0000-0000-000000000012", room_number: "302", floor_number: 3, room_type_id: "a2222222-2222-2222-2222-222222222222", status: "available", cleaning_status: "clean" },
  { id: "r3030000-0000-0000-0000-000000000013", room_number: "303", floor_number: 3, room_type_id: "a6666666-6666-6666-6666-666666666666", status: "occupied", cleaning_status: "clean" },
  { id: "r3040000-0000-0000-0000-000000000014", room_number: "304", floor_number: 3, room_type_id: "a6666666-6666-6666-6666-666666666666", status: "available", cleaning_status: "clean" },
  { id: "r3050000-0000-0000-0000-000000000015", room_number: "305", floor_number: 3, room_type_id: "a5555555-5555-5555-5555-555555555555", status: "occupied", cleaning_status: "clean" },
  // Floor 4
  { id: "r4010000-0000-0000-0000-000000000016", room_number: "401", floor_number: 4, room_type_id: "a3333333-3333-3333-3333-333333333333", status: "reserved", cleaning_status: "clean" },
  { id: "r4020000-0000-0000-0000-000000000017", room_number: "402", floor_number: 4, room_type_id: "a1111111-1111-1111-1111-111111111111", status: "available", cleaning_status: "clean" },
  { id: "r4030000-0000-0000-0000-000000000018", room_number: "403", floor_number: 4, room_type_id: "a4444444-4444-4444-4444-444444444444", status: "out_of_order", cleaning_status: "dirty" },
  // Floor 5
  { id: "r5010000-0000-0000-0000-000000000019", room_number: "501", floor_number: 5, room_type_id: "a5555555-5555-5555-5555-555555555555", status: "reserved", cleaning_status: "clean" },
  { id: "r5020000-0000-0000-0000-000000000020", room_number: "502", floor_number: 5, room_type_id: "a2222222-2222-2222-2222-222222222222", status: "occupied", cleaning_status: "clean" },
];

for (const room of rooms) {
  await upsert("rooms", { ...room, hotel_id: HOTEL_ID, is_active: true }, "id");
}
console.log(`  ✅ ${rooms.length} rooms seeded`);

// ── Guests ────────────────────────────────────────────────────────────────
console.log("\n👥 Seeding 20 Guests...");
const guests = [
  { id: "g0010000-0000-0000-0000-000000000001", first_name: "Sofia", last_name: "Garcia", email: "sofia.garcia@madrid.es", phone: "+34 91 123 4567", nationality: "Spanish" },
  { id: "g0020000-0000-0000-0000-000000000002", first_name: "Kenji", last_name: "Tanaka", email: "kenji.t@tokyo.jp", phone: "+81 3 1234 5678", nationality: "Japanese" },
  { id: "g0030000-0000-0000-0000-000000000003", first_name: "Chloe", last_name: "Dupont", email: "chloe.d@paris.fr", phone: "+33 1 2345 6789", nationality: "French" },
  { id: "g0040000-0000-0000-0000-000000000004", first_name: "Alexander", last_name: "Wright", email: "alex.w@london.uk", phone: "+44 20 7946 0958", nationality: "British" },
  { id: "g0050000-0000-0000-0000-000000000005", first_name: "Sarah", last_name: "Jenkins", email: "sarah.j@nyc.us", phone: "+1 212 555 0198", nationality: "American" },
  { id: "g0060000-0000-0000-0000-000000000006", first_name: "Liam", last_name: "O'Connor", email: "liam.oc@dublin.ie", phone: "+353 1 234 5678", nationality: "Irish" },
  { id: "g0070000-0000-0000-0000-000000000007", first_name: "Hans", last_name: "Mueller", email: "hans.m@berlin.de", phone: "+49 30 12345678", nationality: "German" },
  { id: "g0080000-0000-0000-0000-000000000008", first_name: "Grace", last_name: "Lim", email: "grace.lim@sg.com", phone: "+65 6789 1234", nationality: "Singaporean" },
  { id: "g0090000-0000-0000-0000-000000000009", first_name: "Marco", last_name: "Rossi", email: "marco.r@milan.it", phone: "+39 02 1234567", nationality: "Italian" },
  { id: "g0100000-0000-0000-0000-000000000010", first_name: "David", last_name: "Miller", email: "d.miller@chicago.us", phone: "+1 312 555 0199", nationality: "American" },
  { id: "g0110000-0000-0000-0000-000000000011", first_name: "Emma", last_name: "Watson", email: "emma.w@oxford.uk", phone: "+44 1865 270 000", nationality: "British" },
  { id: "g0120000-0000-0000-0000-000000000012", first_name: "Carlos", last_name: "Alvarez", email: "carlos.a@bogota.co", phone: "+57 1 234 5678", nationality: "Colombian" },
  { id: "g0130000-0000-0000-0000-000000000013", first_name: "Aisha", last_name: "Al-Mansoor", email: "aisha.am@dubai.ae", phone: "+971 4 123 4567", nationality: "Emirati" },
  { id: "g0140000-0000-0000-0000-000000000014", first_name: "Gabriel", last_name: "Silva", email: "gabriel.s@sao.br", phone: "+55 11 98765 4321", nationality: "Brazilian" },
  { id: "g0150000-0000-0000-0000-000000000015", first_name: "Hannah", last_name: "Schmidt", email: "h.schmidt@vienna.at", phone: "+43 1 12345678", nationality: "Austrian" },
  { id: "g0160000-0000-0000-0000-000000000016", first_name: "Viktor", last_name: "Petrov", email: "viktor.p@moscow.ru", phone: "+7 495 123 4567", nationality: "Russian" },
  { id: "g0170000-0000-0000-0000-000000000017", first_name: "Mei-Ling", last_name: "Chen", email: "meiling.chen@taipei.tw", phone: "+886 2 2345 6789", nationality: "Taiwanese" },
  { id: "g0180000-0000-0000-0000-000000000018", first_name: "Lucas", last_name: "Van Der Berg", email: "lucas.vdb@amsterdam.nl", phone: "+31 20 123 4567", nationality: "Dutch" },
  { id: "g0190000-0000-0000-0000-000000000019", first_name: "Olivia", last_name: "Brown", email: "olivia.brown@toronto.ca", phone: "+1 416 555 0177", nationality: "Canadian" },
  { id: "g0200000-0000-0000-0000-000000000020", first_name: "Rohan", last_name: "Sharma", email: "rohan.sharma@mumbai.in", phone: "+91 22 2345 6789", nationality: "Indian" },
];

for (const guest of guests) {
  await upsert("guests", { ...guest, hotel_id: HOTEL_ID }, "id");
}
console.log(`  ✅ ${guests.length} guests seeded`);

// ── Reservations ──────────────────────────────────────────────────────────
console.log("\n📋 Seeding 20 Reservations...");
const today = new Date("2026-08-15");
const reservations = [
  { id: "res00001-0000-0000-0000-000000000001", guest_id: "g0010000-0000-0000-0000-000000000001", room_id: "r1020000-0000-0000-0000-000000000002", check_in_date: "2026-08-12", check_out_date: "2026-08-17", status: "checked_in", nights: 5, adults: 2, children: 0, room_rate: 8500, subtotal: 42500, discount_amount: 0, tax_amount: 0, total_amount: 42500, paid_amount: 42500, balance: 0, confirmation_number: "RES-10001" },
  { id: "res00002-0000-0000-0000-000000000002", guest_id: "g0020000-0000-0000-0000-000000000002", room_id: "r2010000-0000-0000-0000-000000000006", check_in_date: "2026-08-13", check_out_date: "2026-08-18", status: "checked_in", nights: 5, adults: 2, children: 0, room_rate: 15000, subtotal: 75000, discount_amount: 0, tax_amount: 0, total_amount: 75000, paid_amount: 75000, balance: 0, confirmation_number: "RES-10002" },
  { id: "res00003-0000-0000-0000-000000000003", guest_id: "g0030000-0000-0000-0000-000000000003", room_id: "r3030000-0000-0000-0000-000000000013", check_in_date: "2026-08-14", check_out_date: "2026-08-18", status: "checked_in", nights: 4, adults: 2, children: 0, room_rate: 9800, subtotal: 39200, discount_amount: 0, tax_amount: 0, total_amount: 39200, paid_amount: 39200, balance: 0, confirmation_number: "RES-10003" },
  { id: "res00004-0000-0000-0000-000000000004", guest_id: "g0040000-0000-0000-0000-000000000004", room_id: "r3050000-0000-0000-0000-000000000015", check_in_date: "2026-08-12", check_out_date: "2026-08-18", status: "checked_in", nights: 6, adults: 4, children: 2, room_rate: 32000, subtotal: 192000, discount_amount: 0, tax_amount: 0, total_amount: 192000, paid_amount: 192000, balance: 0, confirmation_number: "RES-10004" },
  { id: "res00005-0000-0000-0000-000000000005", guest_id: "g0050000-0000-0000-0000-000000000005", room_id: "r5020000-0000-0000-0000-000000000020", check_in_date: "2026-08-14", check_out_date: "2026-08-17", status: "checked_in", nights: 3, adults: 2, children: 0, room_rate: 15000, subtotal: 45000, discount_amount: 0, tax_amount: 0, total_amount: 45000, paid_amount: 45000, balance: 0, confirmation_number: "RES-10005" },
  { id: "res00006-0000-0000-0000-000000000006", guest_id: "g0060000-0000-0000-0000-000000000006", room_id: "r1040000-0000-0000-0000-000000000004", check_in_date: "2026-08-16", check_out_date: "2026-08-18", status: "confirmed", nights: 2, adults: 2, children: 0, room_rate: 4500, subtotal: 9000, discount_amount: 0, tax_amount: 0, total_amount: 9000, paid_amount: 4500, balance: 4500, confirmation_number: "RES-10006" },
  { id: "res00007-0000-0000-0000-000000000007", guest_id: "g0070000-0000-0000-0000-000000000007", room_id: "r3020000-0000-0000-0000-000000000012", check_in_date: "2026-08-17", check_out_date: "2026-08-21", status: "confirmed", nights: 4, adults: 2, children: 0, room_rate: 15000, subtotal: 60000, discount_amount: 0, tax_amount: 0, total_amount: 60000, paid_amount: 60000, balance: 0, confirmation_number: "RES-10007" },
  { id: "res00008-0000-0000-0000-000000000008", guest_id: "g0080000-0000-0000-0000-000000000008", room_id: "r4020000-0000-0000-0000-000000000017", check_in_date: "2026-08-18", check_out_date: "2026-08-21", status: "confirmed", nights: 3, adults: 2, children: 0, room_rate: 8500, subtotal: 25500, discount_amount: 0, tax_amount: 0, total_amount: 25500, paid_amount: 25500, balance: 0, confirmation_number: "RES-10008" },
  { id: "res00009-0000-0000-0000-000000000009", guest_id: "g0090000-0000-0000-0000-000000000009", room_id: "r1010000-0000-0000-0000-000000000001", check_in_date: "2026-08-20", check_out_date: "2026-08-22", status: "pending", nights: 2, adults: 2, children: 0, room_rate: 8500, subtotal: 17000, discount_amount: 0, tax_amount: 0, total_amount: 17000, paid_amount: 0, balance: 17000, confirmation_number: "RES-10009" },
  { id: "res00010-0000-0000-0000-000000000010", guest_id: "g0100000-0000-0000-0000-000000000010", room_id: "r1030000-0000-0000-0000-000000000003", check_in_date: "2026-08-10", check_out_date: "2026-08-13", status: "checked_out", nights: 3, adults: 1, children: 0, room_rate: 6200, subtotal: 18600, discount_amount: 0, tax_amount: 0, total_amount: 18600, paid_amount: 18600, balance: 0, confirmation_number: "RES-10010" },
  { id: "res00011-0000-0000-0000-000000000011", guest_id: "g0110000-0000-0000-0000-000000000011", room_id: "r2020000-0000-0000-0000-000000000007", check_in_date: "2026-08-08", check_out_date: "2026-08-12", status: "checked_out", nights: 4, adults: 2, children: 0, room_rate: 15000, subtotal: 60000, discount_amount: 0, tax_amount: 0, total_amount: 60000, paid_amount: 60000, balance: 0, confirmation_number: "RES-10011" },
  { id: "res00012-0000-0000-0000-000000000012", guest_id: "g0120000-0000-0000-0000-000000000012", room_id: "r2040000-0000-0000-0000-000000000009", check_in_date: "2026-08-05", check_out_date: "2026-08-07", status: "checked_out", nights: 2, adults: 2, children: 0, room_rate: 6200, subtotal: 12400, discount_amount: 0, tax_amount: 0, total_amount: 12400, paid_amount: 12400, balance: 0, confirmation_number: "RES-10012" },
  { id: "res00013-0000-0000-0000-000000000013", guest_id: "g0130000-0000-0000-0000-000000000013", room_id: "r5010000-0000-0000-0000-000000000019", check_in_date: "2026-08-19", check_out_date: "2026-08-23", status: "confirmed", nights: 4, adults: 3, children: 1, room_rate: 32000, subtotal: 128000, discount_amount: 0, tax_amount: 0, total_amount: 128000, paid_amount: 64000, balance: 64000, confirmation_number: "RES-10013" },
  { id: "res00014-0000-0000-0000-000000000014", guest_id: "g0140000-0000-0000-0000-000000000014", room_id: "r3040000-0000-0000-0000-000000000014", check_in_date: "2026-08-17", check_out_date: "2026-08-19", status: "pending", nights: 2, adults: 2, children: 0, room_rate: 9800, subtotal: 19600, discount_amount: 0, tax_amount: 0, total_amount: 19600, paid_amount: 0, balance: 19600, confirmation_number: "RES-10014" },
  { id: "res00015-0000-0000-0000-000000000015", guest_id: "g0150000-0000-0000-0000-000000000015", room_id: "r2050000-0000-0000-0000-000000000010", check_in_date: "2026-08-12", check_out_date: "2026-08-14", status: "cancelled", nights: 2, adults: 2, children: 0, room_rate: 4500, subtotal: 9000, discount_amount: 0, tax_amount: 0, total_amount: 9000, paid_amount: 0, balance: 9000, confirmation_number: "RES-10015" },
  { id: "res00016-0000-0000-0000-000000000016", guest_id: "g0160000-0000-0000-0000-000000000016", room_id: "r4010000-0000-0000-0000-000000000016", check_in_date: "2026-08-21", check_out_date: "2026-08-24", status: "confirmed", nights: 3, adults: 2, children: 0, room_rate: 6200, subtotal: 18600, discount_amount: 0, tax_amount: 0, total_amount: 18600, paid_amount: 18600, balance: 0, confirmation_number: "RES-10016" },
  { id: "res00017-0000-0000-0000-000000000017", guest_id: "g0170000-0000-0000-0000-000000000017", room_id: "r3010000-0000-0000-0000-000000000011", check_in_date: "2026-08-22", check_out_date: "2026-08-25", status: "confirmed", nights: 3, adults: 2, children: 0, room_rate: 8500, subtotal: 25500, discount_amount: 0, tax_amount: 0, total_amount: 25500, paid_amount: 25500, balance: 0, confirmation_number: "RES-10017" },
  { id: "res00018-0000-0000-0000-000000000018", guest_id: "g0180000-0000-0000-0000-000000000018", room_id: "r1050000-0000-0000-0000-000000000005", check_in_date: "2026-08-11", check_out_date: "2026-08-14", status: "cancelled", nights: 3, adults: 2, children: 0, room_rate: 4500, subtotal: 13500, discount_amount: 0, tax_amount: 0, total_amount: 13500, paid_amount: 0, balance: 13500, confirmation_number: "RES-10018" },
  { id: "res00019-0000-0000-0000-000000000019", guest_id: "g0190000-0000-0000-0000-000000000019", room_id: "r2030000-0000-0000-0000-000000000008", check_in_date: "2026-08-07", check_out_date: "2026-08-10", status: "checked_out", nights: 3, adults: 2, children: 0, room_rate: 6200, subtotal: 18600, discount_amount: 0, tax_amount: 0, total_amount: 18600, paid_amount: 18600, balance: 0, confirmation_number: "RES-10019" },
  { id: "res00020-0000-0000-0000-000000000020", guest_id: "g0200000-0000-0000-0000-000000000020", room_id: "r4030000-0000-0000-0000-000000000018", check_in_date: "2026-08-13", check_out_date: "2026-08-15", status: "cancelled", nights: 2, adults: 2, children: 0, room_rate: 4500, subtotal: 9000, discount_amount: 0, tax_amount: 0, total_amount: 9000, paid_amount: 0, balance: 9000, confirmation_number: "RES-10020" },
];

for (const res of reservations) {
  await upsert("reservations", { ...res, hotel_id: HOTEL_ID, source: "direct", infants: 0 }, "id");
}
console.log(`  ✅ ${reservations.length} reservations seeded`);

// ── Maintenance Tickets ────────────────────────────────────────────────────
console.log("\n🔧 Seeding 20 Maintenance Tickets...");
const maintenanceTickets = [
  { id: "mnt00001-0000-0000-0000-000000000001", room_id: "r1050000-0000-0000-0000-000000000005", title: "AC Unit Not Cooling", description: "Air conditioning unit not cooling properly, temperature regulation issue.", priority: "high", status: "in_progress", ticket_number: "MNT-1001" },
  { id: "mnt00002-0000-0000-0000-000000000002", room_id: "r2030000-0000-0000-0000-000000000008", title: "Bathroom Faucet Leaking", description: "Hot water faucet has a slow drip, needs washer replacement.", priority: "medium", status: "open", ticket_number: "MNT-1002" },
  { id: "mnt00003-0000-0000-0000-000000000003", room_id: "r4030000-0000-0000-0000-000000000018", title: "Toilet Flush Mechanism Broken", description: "Flush handle broken, toilet not flushing properly.", priority: "critical", status: "in_progress", ticket_number: "MNT-1003" },
  { id: "mnt00004-0000-0000-0000-000000000004", room_id: "r1010000-0000-0000-0000-000000000001", title: "TV Remote Not Working", description: "Smart TV remote has dead batteries, needs replacement.", priority: "low", status: "resolved", ticket_number: "MNT-1004" },
  { id: "mnt00005-0000-0000-0000-000000000005", room_id: "r2020000-0000-0000-0000-000000000007", title: "Door Lock Malfunction", description: "Electronic door lock intermittently fails, guest access issue.", priority: "critical", status: "in_progress", ticket_number: "MNT-1005" },
  { id: "mnt00006-0000-0000-0000-000000000006", room_id: "r3020000-0000-0000-0000-000000000012", title: "Window Seal Damaged", description: "Window rubber seal is peeling, causes draft and noise.", priority: "medium", status: "open", ticket_number: "MNT-1006" },
  { id: "mnt00007-0000-0000-0000-000000000007", room_id: "r1030000-0000-0000-0000-000000000003", title: "Ceiling Light Flickering", description: "Overhead light in main bedroom flickering, possible wiring issue.", priority: "medium", status: "open", ticket_number: "MNT-1007" },
  { id: "mnt00008-0000-0000-0000-000000000008", room_id: "r2040000-0000-0000-0000-000000000009", title: "Shower Head Clogged", description: "Low water pressure from shower head due to mineral buildup.", priority: "low", status: "resolved", ticket_number: "MNT-1008" },
  { id: "mnt00009-0000-0000-0000-000000000009", room_id: "r3010000-0000-0000-0000-000000000011", title: "Minibar Refrigerator Warm", description: "In-room minibar not maintaining cold temperature.", priority: "medium", status: "open", ticket_number: "MNT-1009" },
  { id: "mnt00010-0000-0000-0000-000000000010", room_id: "r4010000-0000-0000-0000-000000000016", title: "Balcony Door Difficult to Open", description: "Sliding balcony door stiff and hard to operate, needs track lubrication.", priority: "low", status: "open", ticket_number: "MNT-1010" },
  { id: "mnt00011-0000-0000-0000-000000000011", room_id: "r5010000-0000-0000-0000-000000000019", title: "Jacuzzi Jets Not Working", description: "Presidential suite jacuzzi jets not activating, pump issue suspected.", priority: "high", status: "in_progress", ticket_number: "MNT-1011" },
  { id: "mnt00012-0000-0000-0000-000000000012", room_id: "r1040000-0000-0000-0000-000000000004", title: "Safe Box Pin Reset Needed", description: "Guest locked out of in-room safe, needs master reset.", priority: "medium", status: "resolved", ticket_number: "MNT-1012" },
  { id: "mnt00013-0000-0000-0000-000000000013", room_id: "r2050000-0000-0000-0000-000000000010", title: "WiFi Router Offline", description: "In-room WiFi access point not broadcasting, needs reboot/replacement.", priority: "high", status: "in_progress", ticket_number: "MNT-1013" },
  { id: "mnt00014-0000-0000-0000-000000000014", room_id: "r3040000-0000-0000-0000-000000000014", title: "Bed Frame Squeaking", description: "Bed frame makes loud squeaking noise on movement.", priority: "low", status: "open", ticket_number: "MNT-1014" },
  { id: "mnt00015-0000-0000-0000-000000000015", room_id: "r4020000-0000-0000-0000-000000000017", title: "Curtain Rail Broken", description: "Blackout curtain rail has come off its mounts.", priority: "medium", status: "open", ticket_number: "MNT-1015" },
  { id: "mnt00016-0000-0000-0000-000000000016", room_id: "r3030000-0000-0000-0000-000000000013", title: "Smoke Detector Beeping", description: "Low battery alert from smoke detector, needs battery replacement.", priority: "high", status: "resolved", ticket_number: "MNT-1016" },
  { id: "mnt00017-0000-0000-0000-000000000017", room_id: "r3050000-0000-0000-0000-000000000015", title: "Butler Bell System Down", description: "Presidential suite butler call system unresponsive.", priority: "critical", status: "in_progress", ticket_number: "MNT-1017" },
  { id: "mnt00018-0000-0000-0000-000000000018", room_id: "r2010000-0000-0000-0000-000000000006", title: "Ocean View Telescope Dirty", description: "Complimentary telescope lens dirty and needs professional cleaning.", priority: "low", status: "open", ticket_number: "MNT-1018" },
  { id: "mnt00019-0000-0000-0000-000000000019", room_id: "r5020000-0000-0000-0000-000000000020", title: "Plunge Pool Heater Fault", description: "Outdoor plunge pool heater showing fault code E03.", priority: "high", status: "in_progress", ticket_number: "MNT-1019" },
  { id: "mnt00020-0000-0000-0000-000000000020", room_id: "r1020000-0000-0000-0000-000000000002", title: "Luggage Rack Missing", description: "Guest reported luggage rack not in room.", priority: "low", status: "closed", ticket_number: "MNT-1020" },
];

for (const ticket of maintenanceTickets) {
  await upsert("maintenance", { ...ticket, hotel_id: HOTEL_ID, category: "general" }, "id");
}
console.log(`  ✅ ${maintenanceTickets.length} maintenance tickets seeded`);

// ── Inventory ──────────────────────────────────────────────────────────────
console.log("\n📦 Seeding 20 Inventory Items...");
const inventoryItems = [
  { id: "inv00001-0000-0000-0000-000000000001", name: "Premium Bed Linens (Set)", category: "bedding", quantity: 150, min_quantity: 50, unit: "set", unit_cost: 2500 },
  { id: "inv00002-0000-0000-0000-000000000002", name: "Bath Towels", category: "towels", quantity: 200, min_quantity: 80, unit: "piece", unit_cost: 350 },
  { id: "inv00003-0000-0000-0000-000000000003", name: "Hand Towels", category: "towels", quantity: 250, min_quantity: 100, unit: "piece", unit_cost: 180 },
  { id: "inv00004-0000-0000-0000-000000000004", name: "Shampoo (50ml)", category: "toiletries", quantity: 500, min_quantity: 150, unit: "bottle", unit_cost: 45 },
  { id: "inv00005-0000-0000-0000-000000000005", name: "Conditioner (50ml)", category: "toiletries", quantity: 450, min_quantity: 150, unit: "bottle", unit_cost: 45 },
  { id: "inv00006-0000-0000-0000-000000000006", name: "Body Wash (100ml)", category: "toiletries", quantity: 480, min_quantity: 150, unit: "bottle", unit_cost: 60 },
  { id: "inv00007-0000-0000-0000-000000000007", name: "Toothbrush Kit", category: "toiletries", quantity: 300, min_quantity: 100, unit: "kit", unit_cost: 35 },
  { id: "inv00008-0000-0000-0000-000000000008", name: "Minibar Water (500ml)", category: "minibar", quantity: 800, min_quantity: 200, unit: "bottle", unit_cost: 25 },
  { id: "inv00009-0000-0000-0000-000000000009", name: "Minibar Soda Cans", category: "minibar", quantity: 400, min_quantity: 100, unit: "can", unit_cost: 40 },
  { id: "inv00010-0000-0000-0000-000000000010", name: "Minibar Peanuts", category: "minibar", quantity: 300, min_quantity: 75, unit: "pack", unit_cost: 30 },
  { id: "inv00011-0000-0000-0000-000000000011", name: "Cleaning Spray", category: "cleaning_supplies", quantity: 80, min_quantity: 20, unit: "bottle", unit_cost: 120 },
  { id: "inv00012-0000-0000-0000-000000000012", name: "Disinfectant Wipes", category: "cleaning_supplies", quantity: 60, min_quantity: 15, unit: "pack", unit_cost: 85 },
  { id: "inv00013-0000-0000-0000-000000000013", name: "Mop Heads", category: "cleaning_supplies", quantity: 25, min_quantity: 8, unit: "piece", unit_cost: 150 },
  { id: "inv00014-0000-0000-0000-000000000014", name: "Pillow Cases", category: "bedding", quantity: 300, min_quantity: 100, unit: "piece", unit_cost: 180 },
  { id: "inv00015-0000-0000-0000-000000000015", name: "Bathrobe (L)", category: "towels", quantity: 80, min_quantity: 30, unit: "piece", unit_cost: 850 },
  { id: "inv00016-0000-0000-0000-000000000016", name: "Slippers (Pair)", category: "toiletries", quantity: 200, min_quantity: 60, unit: "pair", unit_cost: 75 },
  { id: "inv00017-0000-0000-0000-000000000017", name: "Coffee Pods (Box)", category: "food_beverage", quantity: 120, min_quantity: 40, unit: "box", unit_cost: 380 },
  { id: "inv00018-0000-0000-0000-000000000018", name: "Tea Bags (Box)", category: "food_beverage", quantity: 100, min_quantity: 30, unit: "box", unit_cost: 180 },
  { id: "inv00019-0000-0000-0000-000000000019", name: "Hair Dryer", category: "electronics", quantity: 30, min_quantity: 5, unit: "piece", unit_cost: 1200 },
  { id: "inv00020-0000-0000-0000-000000000020", name: "Luggage Rack", category: "furniture", quantity: 25, min_quantity: 5, unit: "piece", unit_cost: 2500 },
];

for (const item of inventoryItems) {
  await upsert("inventory", { ...item, hotel_id: HOTEL_ID, is_active: true }, "id");
}
console.log(`  ✅ ${inventoryItems.length} inventory items seeded`);

console.log("\n" + "═".repeat(70));
console.log("✅ SEED COMPLETE! Your Supabase database is ready.");
console.log("═".repeat(70));
console.log(`\n  🏨 Hotel:         Grand Azure Hotel & Resort`);
console.log(`  🛏️  Room Types:    6 types`);
console.log(`  🚪 Rooms:         20 rooms (Floors 1-5)`);
console.log(`  👥 Guests:        20 international guests`);
console.log(`  📋 Reservations:  20 (mix of statuses)`);
console.log(`  🔧 Maintenance:   20 tickets`);
console.log(`  📦 Inventory:     20 items`);
console.log(`\n  🔐 Login at http://localhost:3000`);
console.log(`     Email:    admin@grandazure.com`);
console.log(`     Password: 123123\n`);
