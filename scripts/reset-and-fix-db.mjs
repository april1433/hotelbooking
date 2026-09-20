import pg from "pg";

const DB_URL =
  "postgresql://postgres.flzbtfpylaqchrjyvxod:jay%40gmail.com@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

const HOTEL_ID = "11111111-0000-0000-0000-000000000001";

const ROOM_TYPES = [
  { id: "a1111111-1111-1111-1111-111111111111", name: "Deluxe Suite", slug: "deluxe-suite", description: "Spacious luxury suite featuring a private balcony and panoramic beach views.", max_occupancy: 3, max_adults: 2, max_children: 1, base_price: 8500, bed_type: "King" },
  { id: "a2222222-2222-2222-2222-222222222222", name: "Ocean View Villa", slug: "ocean-view-villa", description: "Exclusive beachfront villa with direct ocean access and private plunge pool.", max_occupancy: 4, max_adults: 3, max_children: 2, base_price: 15000, bed_type: "King" },
  { id: "a3333333-3333-3333-3333-333333333333", name: "Executive King", slug: "executive-king", description: "Modern upscale room tailored for executives and couples seeking premium comfort.", max_occupancy: 2, max_adults: 2, max_children: 0, base_price: 6200, bed_type: "King" },
  { id: "a4444444-4444-4444-4444-444444444444", name: "Standard Twin", slug: "standard-twin", description: "Comfortable twin room ideal for friends or small families.", max_occupancy: 2, max_adults: 2, max_children: 1, base_price: 4500, bed_type: "Twin" },
  { id: "a5555555-5555-5555-5555-555555555555", name: "Presidential Penthouse", slug: "presidential-penthouse", description: "Top-floor penthouse with 360 ocean view, jacuzzi, butler service, and private lounge.", max_occupancy: 6, max_adults: 4, max_children: 2, base_price: 32000, bed_type: "Super King" },
  { id: "a6666666-6666-6666-6666-666666666666", name: "Garden Bungalow", slug: "garden-bungalow", description: "Tranquil tropical bungalow surrounded by flora with open-air rainfall shower.", max_occupancy: 3, max_adults: 2, max_children: 1, base_price: 9800, bed_type: "Queen" },
];

const ROOMS_20 = [
  { id: "b0000000-0000-0000-0000-000000000101", room_number: "101", floor_number: 1, room_type_id: "a1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000000102", room_number: "102", floor_number: 1, room_type_id: "a1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000000103", room_number: "103", floor_number: 1, room_type_id: "a3333333-3333-3333-3333-333333333333" },
  { id: "b0000000-0000-0000-0000-000000000104", room_number: "104", floor_number: 1, room_type_id: "a4444444-4444-4444-4444-444444444444" },
  { id: "b0000000-0000-0000-0000-000000000105", room_number: "105", floor_number: 1, room_type_id: "a4444444-4444-4444-4444-444444444444" },
  { id: "b0000000-0000-0000-0000-000000000201", room_number: "201", floor_number: 2, room_type_id: "a2222222-2222-2222-2222-222222222222" },
  { id: "b0000000-0000-0000-0000-000000000202", room_number: "202", floor_number: 2, room_type_id: "a2222222-2222-2222-2222-222222222222" },
  { id: "b0000000-0000-0000-0000-000000000203", room_number: "203", floor_number: 2, room_type_id: "a3333333-3333-3333-3333-333333333333" },
  { id: "b0000000-0000-0000-0000-000000000204", room_number: "204", floor_number: 2, room_type_id: "a3333333-3333-3333-3333-333333333333" },
  { id: "b0000000-0000-0000-0000-000000000205", room_number: "205", floor_number: 2, room_type_id: "a4444444-4444-4444-4444-444444444444" },
  { id: "b0000000-0000-0000-0000-000000000301", room_number: "301", floor_number: 3, room_type_id: "a1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000000302", room_number: "302", floor_number: 3, room_type_id: "a2222222-2222-2222-2222-222222222222" },
  { id: "b0000000-0000-0000-0000-000000000303", room_number: "303", floor_number: 3, room_type_id: "a6666666-6666-6666-6666-666666666666" },
  { id: "b0000000-0000-0000-0000-000000000304", room_number: "304", floor_number: 3, room_type_id: "a6666666-6666-6666-6666-666666666666" },
  { id: "b0000000-0000-0000-0000-000000000305", room_number: "305", floor_number: 3, room_type_id: "a5555555-5555-5555-5555-555555555555" },
  { id: "b0000000-0000-0000-0000-000000000401", room_number: "401", floor_number: 4, room_type_id: "a3333333-3333-3333-3333-333333333333" },
  { id: "b0000000-0000-0000-0000-000000000402", room_number: "402", floor_number: 4, room_type_id: "a1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000000403", room_number: "403", floor_number: 4, room_type_id: "a4444444-4444-4444-4444-444444444444" },
  { id: "b0000000-0000-0000-0000-000000000501", room_number: "501", floor_number: 5, room_type_id: "a5555555-5555-5555-5555-555555555555" },
  { id: "b0000000-0000-0000-0000-000000000502", room_number: "502", floor_number: 5, room_type_id: "a2222222-2222-2222-2222-222222222222" },
];

const ADMIN_PROFILES = [
  {
    id: "783180e0-28a1-447e-a92d-3658b1d277bb",
    first_name: "Super",
    last_name: "Admin",
    display_name: "Super Admin",
    email: "super@grandazure.com",
    role: "super_admin",
    phone: "+63 917 000 0001",
  },
  {
    id: "5666ade5-264c-472a-89ae-45c50dff1bbe",
    first_name: "System",
    last_name: "Admin",
    display_name: "System Admin",
    email: "admin2@grandazure.com",
    role: "super_admin",
    phone: "+63 917 000 0002",
  },
];

async function main() {
  console.log("Connecting to Supabase PostgreSQL at ap-south-1...");
  const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected successfully.\n");

  // 1. FIX RLS POLICIES ON ALL HOTEL TABLES
  console.log("1. Configuring RLS Policies so queries and bookings work for public & admin...");
  const tables = [
    "hotels",
    "room_types",
    "rooms",
    "reservations",
    "guests",
    "payments",
    "payment_methods",
    "profiles",
    "housekeeping",
    "maintenance",
    "notifications",
    "reviews",
  ];

  for (const table of tables) {
    try {
      // Enable RLS
      await client.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
      // Drop any old policies
      await client.query(`DROP POLICY IF EXISTS "public_all_${table}" ON public."${table}";`);
      await client.query(`DROP POLICY IF EXISTS "Allow public read ${table}" ON public."${table}";`);
      await client.query(`DROP POLICY IF EXISTS "Allow authenticated insert ${table}" ON public."${table}";`);
      await client.query(`DROP POLICY IF EXISTS "Allow authenticated update ${table}" ON public."${table}";`);
      // Create open policy for hotel PMS operations (allows SELECT, INSERT, UPDATE, DELETE for all roles)
      await client.query(`
        CREATE POLICY "public_all_${table}" ON public."${table}"
        FOR ALL
        TO public, anon, authenticated
        USING (true)
        WITH CHECK (true);
      `);
      console.log(`   - Policy created for table: ${table}`);
    } catch (err) {
      console.warn(`   - Warning for ${table}:`, err.message);
    }
  }

  // 2. CLEAR ALL RESERVATIONS, PAYMENTS, GUESTS (NEWLY OPENED HOTEL)
  console.log("\n2. Clearing bookings, guests, payments, housekeeping, reviews...");
  await client.query("DELETE FROM public.payments;");
  await client.query("DELETE FROM public.reservations;");
  await client.query("DELETE FROM public.guests;");
  await client.query("DELETE FROM public.housekeeping;");
  await client.query("DELETE FROM public.maintenance;");
  await client.query("DELETE FROM public.notifications;");
  await client.query("DELETE FROM public.reviews;");
  console.log("   - Purged all reservations, guests, and payments.");

  // 3. SEED HOTEL
  console.log("\n3. Ensuring Hotel record exists...");
  await client.query(`
    INSERT INTO public.hotels (id, name, slug, address, city, country, phone, email, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      address = EXCLUDED.address,
      city = EXCLUDED.city,
      country = EXCLUDED.country,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      is_active = true;
  `, [
    HOTEL_ID,
    "Grand Azure Hotel & Resort",
    "grand-azure-hotel",
    "123 Seaside Boulevard, Resort Zone",
    "Boracay",
    "Philippines",
    "+63 36 288 1234",
    "info@grandazure.com",
  ]);
  console.log("   - Hotel verified.");

  // 4. SEED 6 ROOM TYPES
  console.log("\n4. Ensuring all 6 Room Types exist...");
  for (const rt of ROOM_TYPES) {
    await client.query(`
      INSERT INTO public.room_types (id, hotel_id, name, slug, description, max_occupancy, max_adults, max_children, base_price, bed_type, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        max_occupancy = EXCLUDED.max_occupancy,
        max_adults = EXCLUDED.max_adults,
        max_children = EXCLUDED.max_children,
        base_price = EXCLUDED.base_price,
        bed_type = EXCLUDED.bed_type,
        is_active = true;
    `, [rt.id, HOTEL_ID, rt.name, rt.slug, rt.description, rt.max_occupancy, rt.max_adults, rt.max_children, rt.base_price, rt.bed_type]);
  }
  console.log("   - 6 Room Types active.");

  // 5. RESET & SEED ALL 20 ROOMS AS AVAILABLE & CLEAN
  console.log("\n5. Resetting all 20 rooms to 'available' and 'clean'...");
  await client.query("DELETE FROM public.rooms WHERE hotel_id = $1;", [HOTEL_ID]);
  for (const r of ROOMS_20) {
    await client.query(`
      INSERT INTO public.rooms (id, hotel_id, room_number, floor_number, room_type_id, status, cleaning_status, is_active)
      VALUES ($1, $2, $3, $4, $5, 'available', 'clean', true);
    `, [r.id, HOTEL_ID, r.room_number, r.floor_number, r.room_type_id]);
  }
  console.log("   - All 20 rooms seeded as available & clean.");

  // 6. PURGE DEMO STAFF, KEEP ONLY SUPER ADMIN & SYSTEM ADMIN
  console.log("\n6. Cleaning staff profiles: keeping ONLY Super Admin and System Admin...");
  // Delete demo staff and guest accounts
  await client.query(`
    DELETE FROM public.profiles 
    WHERE email NOT IN ('super@grandazure.com', 'admin2@grandazure.com');
  `);

  for (const p of ADMIN_PROFILES) {
    await client.query(`
      INSERT INTO public.profiles (id, hotel_id, role, first_name, last_name, display_name, email, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        display_name = EXCLUDED.display_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        is_active = true;
    `, [p.id, HOTEL_ID, p.role, p.first_name, p.last_name, p.display_name, p.email, p.phone]);
  }
  console.log("   - Staff cleaned: Super Admin & System Admin active.");

  // 7. VERIFY FINAL DATABASE COUNTS
  console.log("\n7. Verifying final counts:");
  const resCount = await client.query("SELECT COUNT(*) FROM public.reservations");
  const guestCount = await client.query("SELECT COUNT(*) FROM public.guests");
  const roomCount = await client.query("SELECT COUNT(*), status FROM public.rooms GROUP BY status");
  const staffCount = await client.query("SELECT id, email, role, display_name FROM public.profiles");

  console.log(`   - Reservations: ${resCount.rows[0].count}`);
  console.log(`   - Guests: ${guestCount.rows[0].count}`);
  console.log(`   - Rooms:`, roomCount.rows);
  console.log(`   - Staff Profiles (${staffCount.rows.length}):`);
  for (const s of staffCount.rows) {
    console.log(`     * ${s.display_name} (${s.email}) - ${s.role}`);
  }

  await client.end();
  console.log("\nDatabase reset and policy fix complete!");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
