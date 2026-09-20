/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_HOTEL, DEFAULT_ROOM_TYPES, DEFAULT_ROOMS, DEFAULT_STAFF, DEFAULT_GUESTS, DEFAULT_RESERVATIONS } from "@/constants";

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 503 });
    }

    const supabase = createServerClient(supabaseUrl, serviceKey, {
      cookies: { getAll() { return []; }, setAll() {} },
    }) as any;

    // 1. Hotel
    const { error: hotelErr } = await supabase.from("hotels").upsert({
      id: DEFAULT_HOTEL.id,
      name: "Grand Azure Hotel & Resort",
      slug: "grand-azure-hotel",
      address: "123 Seaside Boulevard, Resort Zone",
      city: "Boracay",
      country: "Philippines",
      phone: "+63 36 288 1234",
      email: "info@grandazure.com",
      is_active: true,
    }, { onConflict: "id" });
    if (hotelErr) throw new Error(`Hotels upsert failed: ${hotelErr.message}`);

    // 2. Room Types
    const cleanRoomTypes = DEFAULT_ROOM_TYPES.map(rt => ({
      id: rt.id,
      hotel_id: rt.hotel_id,
      name: rt.name,
      slug: rt.slug,
      description: rt.description,
      base_price: rt.base_price,
      max_occupancy: rt.max_occupancy,
      max_adults: rt.max_adults,
      max_children: rt.max_children,
      bed_type: rt.bed_type,
      size_sqm: rt.size_sqm,
      is_active: true,
    }));
    const { error: rtErr } = await supabase.from("room_types").upsert(cleanRoomTypes, { onConflict: "id" });
    if (rtErr) throw new Error(`Room types upsert failed: ${rtErr.message}`);

    // 3. Rooms (all 20 available and clean)
    const cleanRooms = DEFAULT_ROOMS.map(r => ({
      id: r.id,
      hotel_id: r.hotel_id,
      room_number: r.room_number,
      floor_number: r.floor_number,
      room_type_id: r.room_type_id,
      status: "available",
      cleaning_status: "clean",
      is_active: true,
    }));
    const { error: rErr } = await supabase.from("rooms").upsert(cleanRooms, { onConflict: "id" });
    if (rErr) throw new Error(`Rooms upsert failed: ${rErr.message}`);

    // 4. Profiles (only admin and super admin)
    const cleanStaff = DEFAULT_STAFF.map(s => ({
      id: s.id,
      hotel_id: DEFAULT_HOTEL.id,
      role: s.role,
      first_name: s.first_name,
      last_name: s.last_name,
      display_name: s.display_name,
      email: s.email,
      phone: s.phone,
      is_active: true,
    }));
    const { error: staffErr } = await supabase.from("profiles").upsert(cleanStaff, { onConflict: "id" });
    if (staffErr) throw new Error(`Profiles upsert failed: ${staffErr.message}`);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with clean rooms and admin staff",
      seeded: {
        hotel: 1,
        roomTypes: cleanRoomTypes.length,
        rooms: cleanRooms.length,
        staff: cleanStaff.length,
      }
    });
  } catch (err: any) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
