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
    await supabase.from("hotels").upsert({
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
    await supabase.from("room_types").upsert(cleanRoomTypes, { onConflict: "id" });

    // 3. Rooms
    const cleanRooms = DEFAULT_ROOMS.map(r => ({
      id: r.id,
      hotel_id: r.hotel_id,
      room_number: r.room_number,
      floor_number: r.floor_number,
      room_type_id: r.room_type_id,
      status: r.status,
      cleaning_status: r.cleaning_status,
      is_active: true,
    }));
    await supabase.from("rooms").upsert(cleanRooms, { onConflict: "id" });

    // 4. Profiles
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
    await supabase.from("profiles").upsert(cleanStaff, { onConflict: "id" });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
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
