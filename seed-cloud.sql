-- ==============================================================================
-- GRAND AZURE HOTEL PMS — COMPLETE CLOUD SEED & DOUBLE-BOOKING SHIELD SCRIPT
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/flzbtfpylaqchrjyvxod/sql/new
-- ==============================================================================

-- 1. HOTEL
INSERT INTO public.hotels (id, name, slug, address, city, country, phone, email, is_active)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  'Grand Azure Hotel & Resort',
  'grand-azure-hotel',
  '123 Seaside Boulevard, Resort Zone',
  'Boracay',
  'Philippines',
  '+63 36 288 1234',
  'info@grandazure.com',
  true
) ON CONFLICT (id) DO NOTHING;

-- 2. USER PROFILES (Connects to all verified default accounts)
INSERT INTO public.profiles (id, hotel_id, role, first_name, last_name, display_name, email, is_active)
VALUES
  ('783180e0-28a1-447e-a92d-3658b1d277bb', '11111111-0000-0000-0000-000000000001', 'super_admin', 'Super', 'Admin', 'Super Admin', 'super@grandazure.com', true),
  ('5666ade5-264c-472a-89ae-45c50dff1bbe', '11111111-0000-0000-0000-000000000001', 'super_admin', 'System', 'Admin', 'System Admin', 'admin2@grandazure.com', true),
  ('e6740e03-872a-48fe-9c4f-327941285113', '11111111-0000-0000-0000-000000000001', 'manager', 'Maria', 'Santos', 'Maria Santos', 'manager@grandazure.com', true),
  ('2de78f74-35d0-410d-8020-c83f585f697b', '11111111-0000-0000-0000-000000000001', 'receptionist', 'Juan', 'Dela Cruz', 'Juan Dela Cruz', 'reception@grandazure.com', true),
  ('9d434352-18e2-47f1-bee3-a9e57171369b', '11111111-0000-0000-0000-000000000001', 'housekeeping', 'Elena', 'Reyes', 'Elena Reyes', 'housekeeping@grandazure.com', true),
  ('0e10d1f2-8456-441f-bcea-50254b828d4c', '11111111-0000-0000-0000-000000000001', 'cashier', 'Carlos', 'Mendoza', 'Carlos Mendoza', 'cashier@grandazure.com', true),
  ('9ed06b0b-0111-4d55-a3ef-89de98a3bf5d', '11111111-0000-0000-0000-000000000001', 'maintenance', 'Ramon', 'Bautista', 'Ramon Bautista', 'maintenance@grandazure.com', true),
  ('ac94a14d-fd1f-45a9-a1e3-130afc896318', '11111111-0000-0000-0000-000000000001', 'guest', 'Sofia', 'Garcia', 'Sofia Garcia', 'guest@grandazure.com', true)
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role, 
  first_name = EXCLUDED.first_name, 
  last_name = EXCLUDED.last_name,
  display_name = EXCLUDED.display_name;

-- 3. CLEAN UP EXISTING ROOMS & ROOM TYPES TO AVOID CONSTRAINT CONFLICTS
DELETE FROM public.rooms WHERE hotel_id = '11111111-0000-0000-0000-000000000001';
DELETE FROM public.room_types WHERE hotel_id = '11111111-0000-0000-0000-000000000001';

-- 4. ROOM TYPES (6 Categories matching localhost)
INSERT INTO public.room_types (id, hotel_id, name, slug, description, max_occupancy, max_adults, max_children, base_price, bed_type, is_active)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-0000-0000-0000-000000000001', 'Deluxe Suite', 'deluxe-suite', 'Spacious luxury suite featuring a private balcony and panoramic beach views.', 3, 2, 1, 8500, 'King', true),
  ('a2222222-2222-2222-2222-222222222222', '11111111-0000-0000-0000-000000000001', 'Ocean View Villa', 'ocean-view-villa', 'Exclusive beachfront villa with direct ocean access and private plunge pool.', 4, 3, 2, 15000, 'King', true),
  ('a3333333-3333-3333-3333-333333333333', '11111111-0000-0000-0000-000000000001', 'Executive King', 'executive-king', 'Modern upscale room tailored for executives and couples seeking premium comfort.', 2, 2, 0, 6200, 'King', true),
  ('a4444444-4444-4444-4444-444444444444', '11111111-0000-0000-0000-000000000001', 'Standard Twin', 'standard-twin', 'Comfortable twin room ideal for friends or small families.', 2, 2, 1, 4500, 'Twin', true),
  ('a5555555-5555-5555-5555-555555555555', '11111111-0000-0000-0000-000000000001', 'Presidential Penthouse', 'presidential-penthouse', 'Top-floor penthouse with 360 ocean view, jacuzzi, butler service, and private lounge.', 6, 4, 2, 32000, 'Super King', true),
  ('a6666666-6666-6666-6666-666666666666', '11111111-0000-0000-0000-000000000001', 'Garden Bungalow', 'garden-bungalow', 'Tranquil tropical bungalow surrounded by flora with open-air rainfall shower.', 3, 2, 1, 9800, 'Queen', true);

-- 5. 20 ROOMS (Matching localhost rooms)
INSERT INTO public.rooms (id, hotel_id, room_number, floor_number, room_type_id, status, cleaning_status, is_active)
VALUES
  ('b0000000-0000-0000-0000-000000000101', '11111111-0000-0000-0000-000000000001', '101', 1, 'a1111111-1111-1111-1111-111111111111', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000102', '11111111-0000-0000-0000-000000000001', '102', 1, 'a1111111-1111-1111-1111-111111111111', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000103', '11111111-0000-0000-0000-000000000001', '103', 1, 'a3333333-3333-3333-3333-333333333333', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000104', '11111111-0000-0000-0000-000000000001', '104', 1, 'a4444444-4444-4444-4444-444444444444', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000105', '11111111-0000-0000-0000-000000000001', '105', 1, 'a4444444-4444-4444-4444-444444444444', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000201', '11111111-0000-0000-0000-000000000001', '201', 2, 'a2222222-2222-2222-2222-222222222222', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000202', '11111111-0000-0000-0000-000000000001', '202', 2, 'a2222222-2222-2222-2222-222222222222', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000203', '11111111-0000-0000-0000-000000000001', '203', 2, 'a3333333-3333-3333-3333-333333333333', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000204', '11111111-0000-0000-0000-000000000001', '204', 2, 'a3333333-3333-3333-3333-333333333333', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000205', '11111111-0000-0000-0000-000000000001', '205', 2, 'a4444444-4444-4444-4444-444444444444', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000301', '11111111-0000-0000-0000-000000000001', '301', 3, 'a1111111-1111-1111-1111-111111111111', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000302', '11111111-0000-0000-0000-000000000001', '302', 3, 'a2222222-2222-2222-2222-222222222222', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000303', '11111111-0000-0000-0000-000000000001', '303', 3, 'a6666666-6666-6666-6666-666666666666', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000304', '11111111-0000-0000-0000-000000000001', '304', 3, 'a6666666-6666-6666-6666-666666666666', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000305', '11111111-0000-0000-0000-000000000001', '305', 3, 'a5555555-5555-5555-5555-555555555555', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000401', '11111111-0000-0000-0000-000000000001', '401', 4, 'a3333333-3333-3333-3333-333333333333', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000402', '11111111-0000-0000-0000-000000000001', '402', 4, 'a1111111-1111-1111-1111-111111111111', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000403', '11111111-0000-0000-0000-000000000001', '403', 4, 'a4444444-4444-4444-4444-444444444444', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000501', '11111111-0000-0000-0000-000000000001', '501', 5, 'a5555555-5555-5555-5555-555555555555', 'available', 'clean', true),
  ('b0000000-0000-0000-0000-000000000502', '11111111-0000-0000-0000-000000000001', '502', 5, 'a2222222-2222-2222-2222-222222222222', 'available', 'clean', true);

-- 6. PUBLIC ACCESS POLICIES (Ensures website visitors can view hotel & rooms)
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow public read hotels" ON public.hotels FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read room_types" ON public.room_types FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read rooms" ON public.rooms FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated update profiles" ON public.profiles FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. POSTGRES DOUBLE-BOOKING PROTECTION TRIGGER
-- Declines any overlapping reservation for the same physical room
CREATE OR REPLACE FUNCTION public.prevent_double_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  IF NEW.room_id IS NOT NULL AND NEW.status NOT IN ('cancelled', 'refunded', 'checked_out') THEN
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.reservations
    WHERE room_id = NEW.room_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status NOT IN ('cancelled', 'refunded', 'checked_out')
      AND check_in_date < NEW.check_out_date
      AND check_out_date > NEW.check_in_date;

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'BOOKING_DECLINED: Room is already reserved or occupied for the selected dates.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON public.reservations;
CREATE TRIGGER trg_prevent_double_booking
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();

-- 8. POSTGRES STORED FUNCTION: CHECK ROOM AVAILABILITY & AUTO-ASSIGN
CREATE OR REPLACE FUNCTION public.check_availability(
  p_room_type_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS JSONB AS $$
DECLARE
  v_total_rooms INTEGER;
  v_booked_rooms INTEGER;
  v_available_rooms INTEGER;
  v_available_room_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_total_rooms
  FROM public.rooms
  WHERE room_type_id = p_room_type_id AND is_active = true;

  SELECT COUNT(DISTINCT room_id) INTO v_booked_rooms
  FROM public.reservations
  WHERE room_type_id = p_room_type_id
    AND status NOT IN ('cancelled', 'refunded', 'checked_out')
    AND check_in_date < p_check_out
    AND check_out_date > p_check_in;

  SELECT r.id INTO v_available_room_id
  FROM public.rooms r
  WHERE r.room_type_id = p_room_type_id 
    AND r.is_active = true
    AND r.id NOT IN (
      SELECT res.room_id 
      FROM public.reservations res
      WHERE res.room_id IS NOT NULL
        AND res.status NOT IN ('cancelled', 'refunded', 'checked_out')
        AND res.check_in_date < p_check_out
        AND res.check_out_date > p_check_in
    )
  LIMIT 1;

  v_available_rooms := GREATEST(0, v_total_rooms - v_booked_rooms);

  RETURN jsonb_build_object(
    'is_available', (v_available_rooms > 0 AND v_available_room_id IS NOT NULL),
    'total_rooms', v_total_rooms,
    'booked_rooms', v_booked_rooms,
    'available_rooms', v_available_rooms,
    'assigned_room_id', v_available_room_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
