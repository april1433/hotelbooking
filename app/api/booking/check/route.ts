/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase.types";

export async function POST(req: Request) {
  try {
    const { roomTypeId, roomId, checkInDate, checkOutDate } = await req.json();

    if ((!roomTypeId && !roomId) || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        { available: false, error: "Please provide dates and room selection." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // If no database is configured, allow in demo mode
      return NextResponse.json({ available: true, remaining: 3 });
    }

    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }) as any;

    // 1. If checking a specific individual room
    if (roomId) {
      const { data: conflict } = await supabase
        .from("reservations")
        .select("id")
        .eq("room_id", roomId)
        .not("status", "in", '("cancelled","refunded","checked_out")')
        .lt("check_in_date", checkOutDate)
        .gt("check_out_date", checkInDate)
        .limit(1);

      if (conflict && conflict.length > 0) {
        return NextResponse.json({
          available: false,
          error: "Booking Declined: This room is already occupied/reserved for your chosen dates.",
          code: "ROOM_TAKEN",
        });
      }

      return NextResponse.json({ available: true, roomId });
    }

    // 2. Check via RPC function if present in PostgreSQL
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc(
        "check_availability",
        {
          p_room_type_id: roomTypeId,
          p_check_in: checkInDate,
          p_check_out: checkOutDate,
        }
      );

      if (!rpcErr && rpcRes) {
        if (rpcRes.is_available === false) {
          return NextResponse.json({
            available: false,
            error: "Booking Declined: All suites of this category are fully booked for your selected dates. Please select different dates.",
            code: "ROOM_OCCUPIED",
            remaining: 0,
          });
        }
        return NextResponse.json({
          available: true,
          remaining: rpcRes.available_rooms,
          assignedRoomId: rpcRes.assigned_room_id,
        });
      }
    } catch {
      // Fall through to direct table query
    }

    // 3. Fallback: Direct query on rooms and reservations tables
    const { data: totalRooms } = await supabase
      .from("rooms")
      .select("id")
      .eq("room_type_id", roomTypeId)
      .eq("is_active", true);

    const { data: overlappingReservations } = await supabase
      .from("reservations")
      .select("id, room_id")
      .eq("room_type_id", roomTypeId)
      .not("status", "in", '("cancelled","refunded","checked_out")')
      .lt("check_in_date", checkOutDate)
      .gt("check_out_date", checkInDate);

    const capacity = totalRooms && totalRooms.length > 0 ? totalRooms.length : 3;
    const bookedCount = overlappingReservations ? overlappingReservations.length : 0;
    const remaining = Math.max(0, capacity - bookedCount);

    if (bookedCount >= capacity) {
      return NextResponse.json({
        available: false,
        error: "Booking Declined: All suites of this category are fully booked for your selected dates. Please select different dates.",
        code: "ROOM_OCCUPIED",
        remaining: 0,
      });
    }

    // Find first room not booked
    const bookedRoomIds = new Set(
      (overlappingReservations || []).map((r: any) => r.room_id).filter(Boolean)
    );
    const availableRoom = (totalRooms || []).find((r: any) => !bookedRoomIds.has(r.id));

    return NextResponse.json({
      available: true,
      remaining,
      assignedRoomId: availableRoom?.id || null,
    });
  } catch (err: any) {
    console.error("Availability check error:", err);
    return NextResponse.json(
      { available: true, error: err.message },
      { status: 200 }
    );
  }
}
