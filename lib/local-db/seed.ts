import type { PGlite } from "@electric-sql/pglite";

export const HOTEL_ID = "11111111-0000-0000-0000-000000000001";
export const ADMIN_UUID = "28537215-8bb7-49b9-85d0-2abeeafdbe6e";

export async function seedDatabase(db: PGlite) {
  console.log("🏨 Seeding Hotel...");
  await db.query(
    `INSERT INTO hotels (id, name, slug, address, city, country, phone, email, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
     ON CONFLICT (id) DO NOTHING;`,
    [
      HOTEL_ID,
      "Grand Azure Hotel & Resort",
      "grand-azure-hotel",
      "123 Seaside Boulevard, Resort Zone",
      "Boracay",
      "Philippines",
      "+63 36 288 1234",
      "info@grandazure.com",
    ]
  );

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

  // ── 2. ROOM TYPES (6 Categories) ──────────────────────────────────────────
  console.log("🛏️  Seeding Room Types...");
  const roomTypes = [
    { id: "a1111111-1111-1111-1111-111111111111", name: "Deluxe Suite", slug: "deluxe-suite", desc: "Spacious luxury suite featuring a private balcony and panoramic beach views.", price: 8500, max: 3, bed: "King" },
    { id: "a2222222-2222-2222-2222-222222222222", name: "Ocean View Villa", slug: "ocean-view-villa", desc: "Exclusive beachfront villa with direct ocean access and private plunge pool.", price: 15000, max: 4, bed: "King" },
    { id: "a3333333-3333-3333-3333-333333333333", name: "Executive King", slug: "executive-king", desc: "Modern upscale room tailored for executives and couples seeking premium comfort.", price: 6200, max: 2, bed: "King" },
    { id: "a4444444-4444-4444-4444-444444444444", name: "Standard Twin", slug: "standard-twin", desc: "Comfortable twin room ideal for friends or small families.", price: 4500, max: 2, bed: "Twin" },
    { id: "a5555555-5555-5555-5555-555555555555", name: "Presidential Penthouse", slug: "presidential-penthouse", desc: "Top-floor penthouse with 360 ocean view, jacuzzi, butler service, and private lounge.", price: 32000, max: 6, bed: "Super King" },
    { id: "a6666666-6666-6666-6666-666666666666", name: "Garden Bungalow", slug: "garden-bungalow", desc: "Tranquil tropical bungalow surrounded by flora with open-air rainfall shower.", price: 9800, max: 3, bed: "Queen" },
  ];

  for (const rt of roomTypes) {
    await db.query(
      `INSERT INTO room_types (id, hotel_id, name, slug, description, max_occupancy, base_price, bed_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       ON CONFLICT (id) DO NOTHING;`,
      [rt.id, HOTEL_ID, rt.name, rt.slug, rt.desc, rt.max, rt.price, rt.bed]
    );
  }

  // ── 3. 20 SAMPLE ROOMS ──────────────────────────────────────────────────
  console.log("🚪 Seeding 20 Rooms...");
  const roomsData = [
    { number: "101", type_id: roomTypes[0].id, floor: 1, status: "available", cleaning: "clean" },
    { number: "102", type_id: roomTypes[0].id, floor: 1, status: "occupied", cleaning: "clean" },
    { number: "103", type_id: roomTypes[2].id, floor: 1, status: "available", cleaning: "clean" },
    { number: "104", type_id: roomTypes[3].id, floor: 1, status: "reserved", cleaning: "clean" },
    { number: "105", type_id: roomTypes[3].id, floor: 1, status: "maintenance", cleaning: "dirty" },
    { number: "201", type_id: roomTypes[1].id, floor: 2, status: "occupied", cleaning: "clean" },
    { number: "202", type_id: roomTypes[1].id, floor: 2, status: "available", cleaning: "clean" },
    { number: "203", type_id: roomTypes[2].id, floor: 2, status: "cleaning", cleaning: "in_progress" },
    { number: "204", type_id: roomTypes[2].id, floor: 2, status: "available", cleaning: "clean" },
    { number: "205", type_id: roomTypes[3].id, floor: 2, status: "available", cleaning: "clean" },
    { number: "301", type_id: roomTypes[0].id, floor: 3, status: "available", cleaning: "clean" },
    { number: "302", type_id: roomTypes[1].id, floor: 3, status: "reserved", cleaning: "clean" },
    { number: "303", type_id: roomTypes[5].id, floor: 3, status: "occupied", cleaning: "clean" },
    { number: "304", type_id: roomTypes[5].id, floor: 3, status: "available", cleaning: "clean" },
    { number: "305", type_id: roomTypes[4].id, floor: 3, status: "occupied", cleaning: "inspected" },
    { number: "401", type_id: roomTypes[2].id, floor: 4, status: "available", cleaning: "clean" },
    { number: "402", type_id: roomTypes[0].id, floor: 4, status: "reserved", cleaning: "clean" },
    { number: "403", type_id: roomTypes[3].id, floor: 4, status: "out_of_order", cleaning: "dirty" },
    { number: "501", type_id: roomTypes[4].id, floor: 5, status: "available", cleaning: "inspected" },
    { number: "502", type_id: roomTypes[1].id, floor: 5, status: "occupied", cleaning: "clean" },
  ];

  const roomIdsMap: Record<string, string> = {};

  for (const r of roomsData) {
    const res = await db.query<{ id: string }>(
      `INSERT INTO rooms (hotel_id, room_type_id, room_number, floor_number, status, cleaning_status, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (hotel_id, room_number) DO UPDATE SET status = EXCLUDED.status, cleaning_status = EXCLUDED.cleaning_status
       RETURNING id;`,
      [HOTEL_ID, r.type_id, r.number, r.floor, r.status, r.cleaning]
    );
    if (res.rows[0]?.id) {
      roomIdsMap[r.number] = res.rows[0].id;
    }
  }

  // ── 4. 20 SAMPLE GUESTS & RESERVATIONS ──────────────────────────────────
  console.log("👥 Seeding 20 Guests & Reservations...");
  const sampleGuests = [
    { first: "Sofia", last: "Garcia", email: "sofia.garcia@gmail.com", phone: "+63 917 111 2233", room: "102", status: "checked_in", total: 17000, daysAgo: 1, stayDays: 3 },
    { first: "Kenji", last: "Tanaka", email: "kenji.tanaka@tokyo.jp", phone: "+81 90 1234 5678", room: "201", status: "checked_in", total: 45000, daysAgo: 2, stayDays: 5 },
    { first: "Chloe", last: "Dupont", email: "chloe.dupont@paris.fr", phone: "+33 6 12 34 56 78", room: "303", status: "checked_in", total: 29400, daysAgo: 1, stayDays: 4 },
    { first: "Alexander", last: "Wright", email: "alex.wright@london.uk", phone: "+44 7700 900077", room: "305", status: "checked_in", total: 96000, daysAgo: 3, stayDays: 6 },
    { first: "Sarah", last: "Jenkins", email: "s.jenkins@sydney.au", phone: "+61 400 123 456", room: "502", status: "checked_in", total: 30000, daysAgo: 1, stayDays: 3 },
    { first: "Liam", last: "O'Connor", email: "liam.oc@dublin.ie", phone: "+353 87 123 4567", room: "104", status: "confirmed", total: 9000, daysAgo: -1, stayDays: 2 },
    { first: "Hans", last: "Mueller", email: "hans.m@berlin.de", phone: "+49 151 12345678", room: "302", status: "confirmed", total: 45000, daysAgo: -2, stayDays: 4 },
    { first: "Grace", last: "Lim", email: "grace.lim@singapore.sg", phone: "+65 9123 4567", room: "402", status: "confirmed", total: 25500, daysAgo: -3, stayDays: 3 },
    { first: "Marco", last: "Rossi", email: "marco.rossi@milan.it", phone: "+39 333 1234567", room: "101", status: "pending", total: 17000, daysAgo: -5, stayDays: 2 },
    { first: "David", last: "Miller", email: "david.miller@ny.us", phone: "+1 212 555 0198", room: "103", status: "checked_out", total: 18600, daysAgo: 5, stayDays: 3 },
    { first: "Emma", last: "Watson", email: "emma.watson@oxford.uk", phone: "+44 7911 123456", room: "202", status: "checked_out", total: 45000, daysAgo: 7, stayDays: 4 },
    { first: "Carlos", last: "Alvarez", email: "carlos.a@madrid.es", phone: "+34 612 345 678", room: "204", status: "checked_out", total: 12400, daysAgo: 10, stayDays: 2 },
    { first: "Aisha", last: "Al-Mansoor", email: "aisha@dubai.ae", phone: "+971 50 123 4567", room: "501", status: "confirmed", total: 128000, daysAgo: -4, stayDays: 4 },
    { first: "Gabriel", last: "Silva", email: "gabriel.silva@rio.br", phone: "+55 21 99999 8888", room: "304", status: "pending", total: 19600, daysAgo: -2, stayDays: 2 },
    { first: "Hannah", last: "Schmidt", email: "h.schmidt@vienna.at", phone: "+43 664 1234567", room: "205", status: "cancelled", total: 9000, daysAgo: 3, stayDays: 2 },
    { first: "Viktor", last: "Petrov", email: "viktor.p@moscow.ru", phone: "+7 916 123 4567", room: "401", status: "confirmed", total: 18600, daysAgo: -6, stayDays: 3 },
    { first: "Mei-Ling", last: "Chen", email: "meiling.chen@taipei.tw", phone: "+886 912 345 678", room: "301", status: "confirmed", total: 25500, daysAgo: -7, stayDays: 3 },
    { first: "Lucas", last: "Van Der Berg", email: "lucas.vdb@amsterdam.nl", phone: "+31 6 12345678", room: "105", status: "cancelled", total: 13500, daysAgo: 4, stayDays: 3 },
    { first: "Olivia", last: "Brown", email: "olivia.brown@toronto.ca", phone: "+1 416 555 0147", room: "203", status: "checked_out", total: 18600, daysAgo: 8, stayDays: 3 },
    { first: "Rohan", last: "Sharma", email: "rohan.sharma@mumbai.in", phone: "+91 98200 12345", room: "403", status: "cancelled", total: 9000, daysAgo: 2, stayDays: 2 },
  ];

  for (let idx = 0; idx < sampleGuests.length; idx++) {
    const g = sampleGuests[idx];
    const confNum = `RES-100${String(idx + 1).padStart(2, "0")}`;

    const gRes = await db.query<{ id: string }>(
      `INSERT INTO guests (hotel_id, first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id;`,
      [HOTEL_ID, g.first, g.last, g.email, g.phone]
    );
    const guestId = gRes.rows[0]?.id;
    const roomId = roomIdsMap[g.room];

    if (guestId && roomId) {
      const roomRate = g.total / g.stayDays;
      await db.query(
        `INSERT INTO reservations (
          hotel_id, guest_id, room_id, confirmation_number, status,
          check_in_date, check_out_date, adults, children, room_rate, subtotal, total_amount, paid_amount
         ) VALUES (
          $1, $2, $3, $4, $5,
          CURRENT_DATE - (${g.daysAgo} || ' days')::INTERVAL,
          CURRENT_DATE - (${g.daysAgo} || ' days')::INTERVAL + (${g.stayDays} || ' days')::INTERVAL,
          2, 0, $6, $7, $7, $8
         ) ON CONFLICT (confirmation_number) DO NOTHING;`,
        [
          HOTEL_ID,
          guestId,
          roomId,
          confNum,
          g.status,
          roomRate,
          g.total,
          g.status === "checked_in" || g.status === "checked_out" || g.status === "confirmed" ? g.total : 0,
        ]
      );
    }
  }

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
