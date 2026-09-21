import type { PGlite } from "@electric-sql/pglite";

export const HOTEL_ID  = "11111111-0000-0000-0000-000000000001";
export const HOTEL_ID2 = "11111111-0000-0000-0000-000000000002";
export const HOTEL_ID3 = "11111111-0000-0000-0000-000000000003";
export const HOTEL_ID4 = "11111111-0000-0000-0000-000000000004";
export const HOTEL_ID5 = "11111111-0000-0000-0000-000000000005";
export const HOTEL_ID6 = "11111111-0000-0000-0000-000000000006";
export const ADMIN_UUID = "28537215-8bb7-49b9-85d0-2abeeafdbe6e";

export async function seedDatabase(db: PGlite) {
  console.log("🏨 Seeding Hotels...");

  const hotelsList = [
    {
      id: HOTEL_ID,
      name: "Grand Azure Hotel & Resort",
      slug: "grand-azure-hotel",
      address: "123 Seaside Boulevard, Resort Zone",
      city: "Boracay", country: "Philippines",
      phone: "+63 36 288 1234", email: "info@grandazure.com",
    },
    {
      id: HOTEL_ID2,
      name: "Pilgrims Hotel",
      slug: "pilgrims-hotel",
      address: "45 Pilgrims Road, Uptown",
      city: "Cebu", country: "Philippines",
      phone: "+63 32 234 5678", email: "info@pilgrimshotel.com",
    },
    {
      id: HOTEL_ID3,
      name: "Bay Plaza Hotel",
      slug: "bay-plaza-hotel",
      address: "88 Bay Boulevard, Coastal District",
      city: "Subic", country: "Philippines",
      phone: "+63 47 252 8888", email: "info@bayplazahotel.com",
    },
    {
      id: HOTEL_ID4,
      name: "Mardale Hotel",
      slug: "mardale-hotel",
      address: "78 Mardale Avenue, City Center",
      city: "Davao", country: "Philippines",
      phone: "+63 82 345 6789", email: "info@mardale.com",
    },
    {
      id: HOTEL_ID5,
      name: "GV Hotel",
      slug: "gv-hotel",
      address: "12 General Venue Street",
      city: "Iloilo", country: "Philippines",
      phone: "+63 33 456 7890", email: "info@gvhotel.com",
    },
    {
      id: HOTEL_ID6,
      name: "Lex Hotel",
      slug: "lex-hotel",
      address: "56 Lexington Drive, Business District",
      city: "Cagayan de Oro", country: "Philippines",
      phone: "+63 88 567 8901", email: "info@lexhotel.com",
    },
  ];

  for (const h of hotelsList) {
    await db.query(
      `INSERT INTO hotels (id, name, slug, address, city, country, phone, email, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, city = EXCLUDED.city;`,
      [h.id, h.name, h.slug, h.address, h.city, h.country, h.phone, h.email]
    );
  }

  // ── 1. AUTH USERS & PROFILES ──────────────────────────────────────────────
  console.log("👤 Seeding System Users & Profiles...");
  const systemUsers = [
    { id: ADMIN_UUID, email: "admin@grandazure.com", role: "super_admin", first: "System", last: "Admin" },
    { id: "77777777-7777-4777-8777-777777777777", email: "admin", role: "super_admin", first: "System", last: "Admin" },
    { id: "88888888-8888-4888-8888-888888888888", email: "super@grandazure.com", role: "super_admin", first: "Super", last: "Admin" },
    { id: "33333333-3333-4333-8333-333333333333", email: "manager@grandazure.com", role: "manager", first: "Maria", last: "Santos" },
    { id: "11111111-1111-4111-8111-111111111111", email: "reception@grandazure.com", role: "receptionist", first: "Juan", last: "Dela Cruz" },
    { id: "22222222-2222-4222-8222-222222222222", email: "housekeeping@grandazure.com", role: "housekeeping", first: "Elena", last: "Reyes" },
    { id: "44444444-4444-4444-8444-444444444444", email: "cashier@grandazure.com", role: "cashier", first: "Carlos", last: "Mendoza" },
    { id: "55555555-5555-4555-8555-555555555555", email: "maintenance@grandazure.com", role: "maintenance", first: "Ramon", last: "Bautista" },
    { id: "66666666-6666-4666-8666-666666666666", email: "guest@grandazure.com", role: "guest", first: "Sofia", last: "Garcia" },
  ];

  for (const u of systemUsers) {
    await db.query(
      `INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
       VALUES ($1, $2, '123123', NOW(), $3)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;`,
      [u.id, u.email, JSON.stringify({ first_name: u.first, last_name: u.last, role: u.role })]
    );

    await db.query(
      `INSERT INTO profiles (id, hotel_id, role, first_name, last_name, display_name, email, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name;`,
      [u.id, HOTEL_ID, u.role, u.first, u.last, `${u.first} ${u.last}`, u.email]
    );
  }

  // ── 2. ROOM TYPES ──────────────────────────────────────────────────────────
  console.log("🛏️  Seeding Room Types for all hotels...");

  // Grand Azure Hotel room types
  const roomTypes = [
    { id: "a1111111-1111-1111-1111-111111111111", hotelId: HOTEL_ID,  name: "Deluxe Suite",          slug: "deluxe-suite",          desc: "Spacious luxury suite featuring a private balcony and panoramic beach views.", price: 8500,  max: 3, bed: "King" },
    { id: "a2222222-2222-2222-2222-222222222222", hotelId: HOTEL_ID,  name: "Ocean View Villa",       slug: "ocean-view-villa",       desc: "Exclusive beachfront villa with direct ocean access and private plunge pool.",  price: 15000, max: 4, bed: "King" },
    { id: "a3333333-3333-3333-3333-333333333333", hotelId: HOTEL_ID,  name: "Executive King",         slug: "executive-king",         desc: "Modern upscale room tailored for executives and couples seeking premium comfort.", price: 6200, max: 2, bed: "King" },
    { id: "a4444444-4444-4444-4444-444444444444", hotelId: HOTEL_ID,  name: "Standard Twin",          slug: "standard-twin",          desc: "Comfortable twin room ideal for friends or small families.",                    price: 4500,  max: 2, bed: "Twin" },
    { id: "a5555555-5555-5555-5555-555555555555", hotelId: HOTEL_ID,  name: "Presidential Penthouse", slug: "presidential-penthouse", desc: "Top-floor penthouse with 360 ocean view, jacuzzi, butler service, and private lounge.", price: 32000, max: 6, bed: "Super King" },
    { id: "a6666666-6666-6666-6666-666666666666", hotelId: HOTEL_ID,  name: "Garden Bungalow",         slug: "garden-bungalow",         desc: "Tranquil tropical bungalow surrounded by flora with open-air rainfall shower.",  price: 9800,  max: 3, bed: "Queen" },
    // Pilgrims Hotel
    { id: "b1111111-1111-1111-1111-111111111111", hotelId: HOTEL_ID2, name: "Pilgrims Deluxe Room",    slug: "pilgrims-deluxe-room",    desc: "Comfortable and elegant deluxe room with modern amenities.",                   price: 3500,  max: 2, bed: "Queen" },
    { id: "b2222222-2222-2222-2222-222222222222", hotelId: HOTEL_ID2, name: "Pilgrims Superior Suite", slug: "pilgrims-superior-suite", desc: "Spacious suite with city views and premium lounge comfort.",              price: 5200,  max: 3, bed: "King" },
    // Bay Plaza Hotel
    { id: "bb111111-1111-1111-1111-111111111111", hotelId: HOTEL_ID3, name: "Bay View Suite",          slug: "bay-view-suite",          desc: "Stunning bay-facing suite with private balcony and sunset panorama.",          price: 7500,  max: 3, bed: "King" },
    { id: "bb222222-2222-2222-2222-222222222222", hotelId: HOTEL_ID3, name: "Plaza Executive Room",   slug: "plaza-executive-room",   desc: "Modern executive room tailored for business and relaxation.",                 price: 4600,  max: 2, bed: "Queen" },
    // Mardale Hotel
    { id: "c1111111-1111-1111-1111-111111111111", hotelId: HOTEL_ID4, name: "Mardale Deluxe Room",     slug: "mardale-deluxe-room",     desc: "Elegantly furnished deluxe room in the heart of the city.",                   price: 3800,  max: 2, bed: "King" },
    { id: "c2222222-2222-2222-2222-222222222222", hotelId: HOTEL_ID4, name: "Mardale Executive Suite", slug: "mardale-executive-suite", desc: "Premium executive suite with dedicated work area and lounge.",               price: 6800,  max: 3, bed: "King" },
    // GV Hotel
    { id: "d1111111-1111-1111-1111-111111111111", hotelId: HOTEL_ID5, name: "GV Deluxe Double",       slug: "gv-deluxe-double",       desc: "Clean and comfortable deluxe double room with modern furnishings.",           price: 2800,  max: 2, bed: "Queen" },
    { id: "d2222222-2222-2222-2222-222222222222", hotelId: HOTEL_ID5, name: "GV Family Room",         slug: "gv-family-room",         desc: "Spacious family room with extra beds and child-friendly amenities.",         price: 3500,  max: 4, bed: "Twin" },
    // Lex Hotel
    { id: "e1111111-1111-1111-1111-111111111111", hotelId: HOTEL_ID6, name: "Lex Classic Room",        slug: "lex-classic-room",       desc: "Timeless classic room with refined interiors and all essentials.",           price: 3200,  max: 2, bed: "Queen" },
    { id: "e2222222-2222-2222-2222-222222222222", hotelId: HOTEL_ID6, name: "Lex Junior Suite",        slug: "lex-junior-suite",       desc: "Comfortable junior suite with separate seating area.",                       price: 5500,  max: 3, bed: "King" },
  ];

  for (const rt of roomTypes) {
    await db.query(
      `INSERT INTO room_types (id, hotel_id, name, slug, description, max_occupancy, base_price, bed_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_price = EXCLUDED.base_price;`,
      [rt.id, rt.hotelId, rt.name, rt.slug, rt.desc, rt.max, rt.price, rt.bed]
    );
  }

  // ── 3. ROOMS (for all hotels) ────────────────────────────────────────────
  console.log("🚪 Seeding Rooms for all hotels...");

  // Room type ID references by index position in roomTypes array
  const allRoomsData = [
    // Grand Azure Hotel
    { hotel: HOTEL_ID, number: "101", type_id: "a1111111-1111-1111-1111-111111111111", floor: 1 },
    { hotel: HOTEL_ID, number: "102", type_id: "a1111111-1111-1111-1111-111111111111", floor: 1 },
    { hotel: HOTEL_ID, number: "103", type_id: "a3333333-3333-3333-3333-333333333333", floor: 1 },
    { hotel: HOTEL_ID, number: "104", type_id: "a4444444-4444-4444-4444-444444444444", floor: 1 },
    { hotel: HOTEL_ID, number: "105", type_id: "a4444444-4444-4444-4444-444444444444", floor: 1 },
    { hotel: HOTEL_ID, number: "201", type_id: "a2222222-2222-2222-2222-222222222222", floor: 2 },
    { hotel: HOTEL_ID, number: "202", type_id: "a2222222-2222-2222-2222-222222222222", floor: 2 },
    { hotel: HOTEL_ID, number: "203", type_id: "a3333333-3333-3333-3333-333333333333", floor: 2 },
    { hotel: HOTEL_ID, number: "204", type_id: "a3333333-3333-3333-3333-333333333333", floor: 2 },
    { hotel: HOTEL_ID, number: "205", type_id: "a4444444-4444-4444-4444-444444444444", floor: 2 },
    { hotel: HOTEL_ID, number: "301", type_id: "a1111111-1111-1111-1111-111111111111", floor: 3 },
    { hotel: HOTEL_ID, number: "302", type_id: "a2222222-2222-2222-2222-222222222222", floor: 3 },
    { hotel: HOTEL_ID, number: "303", type_id: "a6666666-6666-6666-6666-666666666666", floor: 3 },
    { hotel: HOTEL_ID, number: "304", type_id: "a6666666-6666-6666-6666-666666666666", floor: 3 },
    { hotel: HOTEL_ID, number: "305", type_id: "a5555555-5555-5555-5555-555555555555", floor: 3 },
    { hotel: HOTEL_ID, number: "401", type_id: "a3333333-3333-3333-3333-333333333333", floor: 4 },
    { hotel: HOTEL_ID, number: "402", type_id: "a1111111-1111-1111-1111-111111111111", floor: 4 },
    { hotel: HOTEL_ID, number: "403", type_id: "a4444444-4444-4444-4444-444444444444", floor: 4 },
    { hotel: HOTEL_ID, number: "501", type_id: "a5555555-5555-5555-5555-555555555555", floor: 5 },
    { hotel: HOTEL_ID, number: "502", type_id: "a2222222-2222-2222-2222-222222222222", floor: 5 },
    // Pilgrims Hotel
    { hotel: HOTEL_ID2, number: "101", type_id: "b1111111-1111-1111-1111-111111111111", floor: 1 },
    { hotel: HOTEL_ID2, number: "102", type_id: "b1111111-1111-1111-1111-111111111111", floor: 1 },
    { hotel: HOTEL_ID2, number: "201", type_id: "b2222222-2222-2222-2222-222222222222", floor: 2 },
    // Bay Plaza Hotel
    { hotel: HOTEL_ID3, number: "101", type_id: "bb111111-1111-1111-1111-111111111111", floor: 1 },
    { hotel: HOTEL_ID3, number: "102", type_id: "bb222222-2222-2222-2222-222222222222", floor: 1 },
    { hotel: HOTEL_ID3, number: "201", type_id: "bb111111-1111-1111-1111-111111111111", floor: 2 },
    // Mardale Hotel
    { hotel: HOTEL_ID4, number: "101", type_id: "c1111111-1111-1111-1111-111111111111", floor: 1 },
    { hotel: HOTEL_ID4, number: "102", type_id: "c1111111-1111-1111-1111-111111111111", floor: 1 },
    { hotel: HOTEL_ID4, number: "201", type_id: "c2222222-2222-2222-2222-222222222222", floor: 2 },
    // GV Hotel
    { hotel: HOTEL_ID5, number: "101", type_id: "d1111111-1111-1111-1111-111111111111", floor: 1 },
    { hotel: HOTEL_ID5, number: "102", type_id: "d1111111-1111-1111-1111-111111111111", floor: 1 },
    { hotel: HOTEL_ID5, number: "201", type_id: "d2222222-2222-2222-2222-222222222222", floor: 2 },
    // Lex Hotel
    { hotel: HOTEL_ID6, number: "101", type_id: "e1111111-1111-1111-1111-111111111111", floor: 1 },
    { hotel: HOTEL_ID6, number: "102", type_id: "e1111111-1111-1111-1111-111111111111", floor: 1 },
    { hotel: HOTEL_ID6, number: "201", type_id: "e2222222-2222-2222-2222-222222222222", floor: 2 },
  ];

  const roomIdsMap: Record<string, string> = {};

  for (const r of allRoomsData) {
    const res = await db.query<{ id: string }>(
      `INSERT INTO rooms (hotel_id, room_type_id, room_number, floor_number, status, cleaning_status, is_active)
       VALUES ($1, $2, $3, $4, 'available', 'clean', true)
       ON CONFLICT (hotel_id, room_number) DO UPDATE SET status = 'available', cleaning_status = 'clean'
       RETURNING id;`,
      [r.hotel, r.type_id, r.number, r.floor]
    );
    if (res.rows[0]?.id) {
      roomIdsMap[`${r.hotel}-${r.number}`] = res.rows[0].id;
    }
  }

  // ── 4. (No sample guests/reservations — hotel starts fresh) ────────────
  console.log("✅ Skipping sample guests/reservations — hotel starts fresh.");
  void roomIdsMap;

  // ── 5. 20 SAMPLE MAINTENANCE TICKETS ──────────────────────────────────
  console.log("🛠️  Seeding 20 Maintenance Tickets...");
  const maintenanceItems = [
    { room: "105", title: "Air conditioner leaking water", priority: "critical", status: "in_progress" },
    { room: "403", title: "Balcony sliding door lock broken", priority: "high", status: "open" },
    { room: "203", title: "Bathroom light flickering", priority: "low", status: "resolved" },
    { room: "102", title: "TV remote battery replacement", priority: "low", status: "closed" },
    { room: "201", title: "Plunge pool temperature sensor check", priority: "medium", status: "in_progress" },
    { room: "305", title: "Penthouse jacuzzi jet cleaning", priority: "medium", status: "resolved" },
    { room: "303", title: "Bungalow outdoor rainfall shower low pressure", priority: "high", status: "open" },
    { room: "104", title: "Keycard door lock battery low warning", priority: "medium", status: "resolved" },
    { room: "204", title: "Minibar fridge not cooling properly", priority: "low", status: "closed" },
    { room: "301", title: "Safe box keypad error", priority: "high", status: "open" },
    { room: "302", title: "Window drape track loose", priority: "low", status: "open" },
    { room: "401", title: "Balcony light bulb replacement", priority: "low", status: "resolved" },
    { room: "402", title: "Drainage slow in bathroom sink", priority: "medium", status: "in_progress" },
    { room: "501", title: "Penthouse audio system Bluetooth sync check", priority: "low", status: "closed" },
    { room: "502", title: "Ocean view terrace umbrella re-anchoring", priority: "high", status: "open" },
    { room: "101", title: "Coffee machine descaling required", priority: "low", status: "closed" },
    { room: "103", title: "Telephone line static noise", priority: "low", status: "resolved" },
    { room: "202", title: "Ceiling fan speed controller stiff", priority: "low", status: "open" },
    { room: "205", title: "Wardrobe light sensor misaligned", priority: "low", status: "closed" },
    { room: "304", title: "Bungalow garden path lamp replacement", priority: "medium", status: "resolved" },
  ];

  for (let idx = 0; idx < maintenanceItems.length; idx++) {
    const m = maintenanceItems[idx];
    const tNum = `MNT-10${String(idx + 1).padStart(2, "0")}`;
    const rId = roomIdsMap[m.room];

    await db.query(
      `INSERT INTO maintenance (
        hotel_id, room_id, ticket_number, title, priority, status
       ) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (ticket_number) DO NOTHING;`,
      [HOTEL_ID, rId ?? null, tNum, m.title, m.priority, m.status]
    );
  }

  // ── 6. 20 SAMPLE INVENTORY ITEMS ────────────────────────────────────────
  console.log("📦 Seeding 20 Inventory Items...");
  const inventoryData = [
    { name: "Egyptian Cotton King Sheets", cat: "bedding", qty: 150, min: 30, unit: "set" },
    { name: "Plush Bath Towels (70x140cm)", cat: "towels", qty: 300, min: 50, unit: "pcs" },
    { name: "Luxury Organic Shampoo 250ml", cat: "toiletries", qty: 500, min: 100, unit: "bottle" },
    { name: "Organic Conditioner 250ml", cat: "toiletries", qty: 480, min: 100, unit: "bottle" },
    { name: "Argan Oil Body Wash 250ml", cat: "toiletries", qty: 520, min: 100, unit: "bottle" },
    { name: "Velour Hotel Bathrobes (L)", cat: "towels", qty: 80, min: 20, unit: "pcs" },
    { name: "Nespresso Intenso Pods (Box of 50)", cat: "food_beverage", qty: 45, min: 10, unit: "box" },
    { name: "San Pellegrino Sparkling Water 750ml", cat: "minibar", qty: 240, min: 40, unit: "bottle" },
    { name: "Evian Natural Mineral Water 500ml", cat: "minibar", qty: 600, min: 100, unit: "bottle" },
    { name: "Premium Red Wine (Cabernet 750ml)", cat: "minibar", qty: 60, min: 15, unit: "bottle" },
    { name: "Microfiber Cleaning Cloths", cat: "cleaning_supplies", qty: 200, min: 30, unit: "pack" },
    { name: "Eco-Friendly All-Surface Sanitizer 5L", cat: "cleaning_supplies", qty: 25, min: 5, unit: "canister" },
    { name: "Hypoallergenic Pillow Inserts", cat: "bedding", qty: 120, min: 25, unit: "pcs" },
    { name: "Bamboo Toothbrush Kits", cat: "toiletries", qty: 800, min: 150, unit: "kit" },
    { name: "Embroidered Room Slippers", cat: "toiletries", qty: 600, min: 100, unit: "pair" },
    { name: "Smart Keycards (RFID)", cat: "electronics", qty: 400, min: 50, unit: "pcs" },
    { name: "Universal Power Adapters", cat: "electronics", qty: 50, min: 10, unit: "pcs" },
    { name: "Pool & Beach Lounge Towels", cat: "towels", qty: 250, min: 40, unit: "pcs" },
    { name: "Scented Lavender Room Spray 100ml", cat: "cleaning_supplies", qty: 90, min: 20, unit: "bottle" },
    { name: "Handcrafted Welcome Chocolate Box", cat: "food_beverage", qty: 75, min: 15, unit: "box" },
  ];

  for (const inv of inventoryData) {
    await db.query(
      `INSERT INTO inventory (
        hotel_id, name, category, quantity, min_quantity, unit, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT DO NOTHING;`,
      [HOTEL_ID, inv.name, inv.cat, inv.qty, inv.min, inv.unit]
    );
  }

  console.log("✅ All 20 sample datasets seeded successfully!");
}
