import pg from "pg";

const DB_URL =
  "postgresql://postgres.flzbtfpylaqchrjyvxod:jay%40gmail.com@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

const HOTELS = [
  {
    id: "11111111-0000-0000-0000-000000000001",
    name: "Grand Azure Hotel & Resort",
    slug: "grand-azure-hotel",
    address: "123 Seaside Boulevard, Resort Zone",
    city: "Boracay", country: "Philippines",
    phone: "+63 36 288 1234", email: "info@grandazure.com",
  },
  {
    id: "11111111-0000-0000-0000-000000000002",
    name: "Pilgrims Hotel",
    slug: "pilgrims-hotel",
    address: "45 Pilgrims Road, Uptown",
    city: "Cebu", country: "Philippines",
    phone: "+63 32 234 5678", email: "info@pilgrimshotel.com",
  },
  {
    id: "11111111-0000-0000-0000-000000000003",
    name: "Bay Plaza Hotel",
    slug: "bay-plaza-hotel",
    address: "88 Bay Boulevard, Coastal District",
    city: "Subic", country: "Philippines",
    phone: "+63 47 252 8888", email: "info@bayplazahotel.com",
  },
  {
    id: "11111111-0000-0000-0000-000000000004",
    name: "Mardale Hotel",
    slug: "mardale-hotel",
    address: "78 Mardale Avenue, City Center",
    city: "Davao", country: "Philippines",
    phone: "+63 82 345 6789", email: "info@mardale.com",
  },
  {
    id: "11111111-0000-0000-0000-000000000005",
    name: "GV Hotel",
    slug: "gv-hotel",
    address: "12 General Venue Street",
    city: "Iloilo", country: "Philippines",
    phone: "+63 33 456 7890", email: "info@gvhotel.com",
  },
  {
    id: "11111111-0000-0000-0000-000000000006",
    name: "Lex Hotel",
    slug: "lex-hotel",
    address: "56 Lexington Drive, Business District",
    city: "Cagayan de Oro", country: "Philippines",
    phone: "+63 88 567 8901", email: "info@lexhotel.com",
  },
];

const ROOM_TYPES = [
  // Grand Azure Hotel
  { id: "a1111111-1111-1111-1111-111111111111", hotelId: "11111111-0000-0000-0000-000000000001", name: "Deluxe Suite", slug: "deluxe-suite", description: "Spacious luxury suite featuring a private balcony and panoramic beach views.", price: 8500, max: 3, bed: "King" },
  { id: "a2222222-2222-2222-2222-222222222222", hotelId: "11111111-0000-0000-0000-000000000001", name: "Ocean View Villa", slug: "ocean-view-villa", description: "Exclusive beachfront villa with direct ocean access and private plunge pool.", price: 15000, max: 4, bed: "King" },
  { id: "a3333333-3333-3333-3333-333333333333", hotelId: "11111111-0000-0000-0000-000000000001", name: "Executive King", slug: "executive-king", description: "Modern upscale room tailored for executives and couples seeking premium comfort.", price: 6200, max: 2, bed: "King" },
  { id: "a4444444-4444-4444-4444-444444444444", hotelId: "11111111-0000-0000-0000-000000000001", name: "Standard Twin", slug: "standard-twin", description: "Comfortable twin room ideal for friends or small families.", price: 4500, max: 2, bed: "Twin" },
  { id: "a5555555-5555-5555-5555-555555555555", hotelId: "11111111-0000-0000-0000-000000000001", name: "Presidential Penthouse", slug: "presidential-penthouse", description: "Top-floor penthouse with 360 ocean view, jacuzzi, butler service, and private lounge.", price: 32000, max: 6, bed: "Super King" },
  { id: "a6666666-6666-6666-6666-666666666666", hotelId: "11111111-0000-0000-0000-000000000001", name: "Garden Bungalow", slug: "garden-bungalow", description: "Tranquil tropical bungalow surrounded by flora with open-air rainfall shower.", price: 9800, max: 3, bed: "Queen" },
  // Pilgrims Hotel
  { id: "b1111111-1111-1111-1111-111111111111", hotelId: "11111111-0000-0000-0000-000000000002", name: "Pilgrims Deluxe Room", slug: "pilgrims-deluxe-room", description: "Comfortable and elegant deluxe room with modern amenities.", price: 3500, max: 2, bed: "Queen" },
  { id: "b2222222-2222-2222-2222-222222222222", hotelId: "11111111-0000-0000-0000-000000000002", name: "Pilgrims Superior Suite", slug: "pilgrims-superior-suite", description: "Spacious suite with city views and premium lounge comfort.", price: 5200, max: 3, bed: "King" },
  // Bay Plaza Hotel
  { id: "bb111111-1111-1111-1111-111111111111", hotelId: "11111111-0000-0000-0000-000000000003", name: "Bay View Suite", slug: "bay-view-suite", description: "Stunning bay-facing suite with private balcony and sunset panorama.", price: 7500, max: 3, bed: "King" },
  { id: "bb222222-2222-2222-2222-222222222222", hotelId: "11111111-0000-0000-0000-000000000003", name: "Plaza Executive Room", slug: "plaza-executive-room", description: "Modern executive room tailored for business and relaxation.", price: 4600, max: 2, bed: "Queen" },
  // Mardale Hotel
  { id: "c1111111-1111-1111-1111-111111111111", hotelId: "11111111-0000-0000-0000-000000000004", name: "Mardale Deluxe Room", slug: "mardale-deluxe-room", description: "Elegantly furnished deluxe room in the heart of the city.", price: 3800, max: 2, bed: "King" },
  { id: "c2222222-2222-2222-2222-222222222222", hotelId: "11111111-0000-0000-0000-000000000004", name: "Mardale Executive Suite", slug: "mardale-executive-suite", description: "Premium executive suite with dedicated work area and lounge.", price: 6800, max: 3, bed: "King" },
  // GV Hotel
  { id: "d1111111-1111-1111-1111-111111111111", hotelId: "11111111-0000-0000-0000-000000000005", name: "GV Deluxe Double", slug: "gv-deluxe-double", description: "Clean and comfortable deluxe double room with modern furnishings.", price: 2800, max: 2, bed: "Queen" },
  { id: "d2222222-2222-2222-2222-222222222222", hotelId: "11111111-0000-0000-0000-000000000005", name: "GV Family Room", slug: "gv-family-room", description: "Spacious family room with extra beds and child-friendly amenities.", price: 3500, max: 4, bed: "Twin" },
  // Lex Hotel
  { id: "e1111111-1111-1111-1111-111111111111", hotelId: "11111111-0000-0000-0000-000000000006", name: "Lex Classic Room", slug: "lex-classic-room", description: "Timeless classic room with refined interiors and all essentials.", price: 3200, max: 2, bed: "Queen" },
  { id: "e2222222-2222-2222-2222-222222222222", hotelId: "11111111-0000-0000-0000-000000000006", name: "Lex Junior Suite", slug: "lex-junior-suite", description: "Comfortable junior suite with separate seating area.", price: 5500, max: 3, bed: "King" },
];

const ROOMS = [
  // Pilgrims Hotel
  { id: "b0000000-0000-0000-0000-000000001101", hotel: "11111111-0000-0000-0000-000000000002", number: "101", floor: 1, type: "b1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000001102", hotel: "11111111-0000-0000-0000-000000000002", number: "102", floor: 1, type: "b1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000001201", hotel: "11111111-0000-0000-0000-000000000002", number: "201", floor: 2, type: "b2222222-2222-2222-2222-222222222222" },
  // Bay Plaza Hotel
  { id: "b0000000-0000-0000-0000-000000002101", hotel: "11111111-0000-0000-0000-000000000003", number: "101", floor: 1, type: "bb111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000002102", hotel: "11111111-0000-0000-0000-000000000003", number: "102", floor: 1, type: "bb222222-2222-2222-2222-222222222222" },
  { id: "b0000000-0000-0000-0000-000000002201", hotel: "11111111-0000-0000-0000-000000000003", number: "201", floor: 2, type: "bb111111-1111-1111-1111-111111111111" },
  // Mardale Hotel
  { id: "b0000000-0000-0000-0000-000000003101", hotel: "11111111-0000-0000-0000-000000000004", number: "101", floor: 1, type: "c1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000003102", hotel: "11111111-0000-0000-0000-000000000004", number: "102", floor: 1, type: "c1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000003201", hotel: "11111111-0000-0000-0000-000000000004", number: "201", floor: 2, type: "c2222222-2222-2222-2222-222222222222" },
  // GV Hotel
  { id: "b0000000-0000-0000-0000-000000004101", hotel: "11111111-0000-0000-0000-000000000005", number: "101", floor: 1, type: "d1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000004102", hotel: "11111111-0000-0000-0000-000000000005", number: "102", floor: 1, type: "d1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000004201", hotel: "11111111-0000-0000-0000-000000000005", number: "201", floor: 2, type: "d2222222-2222-2222-2222-222222222222" },
  // Lex Hotel
  { id: "b0000000-0000-0000-0000-000000005101", hotel: "11111111-0000-0000-0000-000000000006", number: "101", floor: 1, type: "e1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000005102", hotel: "11111111-0000-0000-0000-000000000006", number: "102", floor: 1, type: "e1111111-1111-1111-1111-111111111111" },
  { id: "b0000000-0000-0000-0000-000000005201", hotel: "11111111-0000-0000-0000-000000000006", number: "201", floor: 2, type: "e2222222-2222-2222-2222-222222222222" },
];

async function main() {
  console.log("Connecting to Supabase PostgreSQL at ap-south-1...");
  const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected successfully.\n");

  console.log("1. Upserting all 6 hotels...");
  for (const h of HOTELS) {
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
    `, [h.id, h.name, h.slug, h.address, h.city, h.country, h.phone, h.email]);
  }
  console.log("✓ All 6 hotels upserted.");

  console.log("\n2. Upserting room types for all hotels...");
  for (const rt of ROOM_TYPES) {
    await client.query(`
      INSERT INTO public.room_types (id, hotel_id, name, slug, description, max_occupancy, base_price, bed_type, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        max_occupancy = EXCLUDED.max_occupancy,
        base_price = EXCLUDED.base_price,
        bed_type = EXCLUDED.bed_type,
        is_active = true;
    `, [rt.id, rt.hotelId, rt.name, rt.slug, rt.description, rt.max, rt.price, rt.bed]);
  }
  console.log("✓ Room types upserted.");

  console.log("\n3. Upserting rooms for all hotels...");
  for (const r of ROOMS) {
    await client.query(`
      INSERT INTO public.rooms (id, hotel_id, room_number, floor_number, room_type_id, status, cleaning_status, is_active)
      VALUES ($1, $2, $3, $4, $5, 'available', 'clean', true)
      ON CONFLICT (id) DO UPDATE SET
        status = 'available',
        cleaning_status = 'clean',
        is_active = true;
    `, [r.id, r.hotel, r.number, r.floor, r.type]);
  }
  console.log("✓ Rooms upserted.");

  console.log("\n4. Checking current hotels in database:");
  const res = await client.query("SELECT id, name, city, is_active FROM public.hotels ORDER BY name ASC;");
  for (const row of res.rows) {
    console.log(`  - [${row.name}] (${row.city}) ID: ${row.id}`);
  }

  await client.end();
  console.log("\nDone!");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
