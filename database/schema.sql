-- ============================================================
-- Hotel PMS — Complete PostgreSQL Schema
-- Version: 1.0.0
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUMS (safe to re-run — skips if already exists)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'guest', 'receptionist', 'housekeeping', 'cashier',
    'maintenance', 'manager', 'super_admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM (
    'pending', 'confirmed', 'checked_in', 'checked_out',
    'cancelled', 'no_show', 'waitlisted'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE room_status AS ENUM (
    'available', 'occupied', 'reserved', 'maintenance',
    'out_of_order', 'cleaning'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cleaning_status AS ENUM (
    'clean', 'dirty', 'in_progress', 'inspected', 'do_not_disturb'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending', 'processing', 'completed', 'failed',
    'refunded', 'partially_refunded', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM (
    'credit_card', 'debit_card', 'cash', 'bank_transfer',
    'gcash', 'maya', 'paypal', 'stripe', 'paymongo', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'deferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'booking_confirmation', 'booking_reminder', 'booking_cancellation',
    'payment_received', 'payment_reminder', 'checkout_reminder',
    'maintenance_update', 'housekeeping_update', 'inventory_alert',
    'system', 'promotion', 'review_request'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_category AS ENUM (
    'bedding', 'toiletries', 'minibar', 'cleaning_supplies',
    'towels', 'electronics', 'furniture', 'food_beverage', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE stock_movement_type AS ENUM (
    'purchase', 'consumption', 'waste', 'transfer', 'adjustment', 'return'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- HOTELS
-- ============================================================

CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Philippines',
  postal_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  star_rating SMALLINT CHECK (star_rating BETWEEN 1 AND 5),
  check_in_time TIME DEFAULT '14:00:00',
  check_out_time TIME DEFAULT '12:00:00',
  timezone VARCHAR(100) DEFAULT 'Asia/Manila',
  currency VARCHAR(10) DEFAULT 'PHP',
  logo_url TEXT,
  cover_url TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROLES & PERMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name user_role UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'rooms:read', 'bookings:write'
  description TEXT,
  module VARCHAR(50), -- 'rooms', 'bookings', 'reports', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES hotels(id),
  role user_role DEFAULT 'guest',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  date_of_birth DATE,
  nationality VARCHAR(100),
  id_type VARCHAR(50), -- passport, driver_license, national_id
  id_number VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{
    "email": true,
    "sms": false,
    "push": true,
    "booking_updates": true,
    "promotions": false
  }',
  two_factor_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FLOORS & ROOM TYPES
-- ============================================================

CREATE TABLE IF NOT EXISTS floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  name VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(hotel_id, number)
);

CREATE TABLE IF NOT EXISTS room_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  short_description VARCHAR(255),
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  max_adults INTEGER DEFAULT 2,
  max_children INTEGER DEFAULT 1,
  size_sqm DECIMAL(6,2),
  bed_type VARCHAR(100), -- 'King', 'Queen', 'Twin', 'Double'
  base_price DECIMAL(10,2) NOT NULL,
  weekend_price DECIMAL(10,2),
  seasonal_price JSONB DEFAULT '[]', -- [{start, end, price}]
  cancellation_policy TEXT,
  cover_image_url TEXT,
  images JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, slug)
);

-- ============================================================
-- AMENITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(100), -- lucide icon name
  category VARCHAR(50), -- 'room', 'hotel', 'bathroom', 'tech'
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS room_type_amenities (
  room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
  amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (room_type_id, amenity_id)
);

-- ============================================================
-- ROOMS
-- ============================================================

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  floor_id UUID REFERENCES floors(id),
  room_type_id UUID NOT NULL REFERENCES room_types(id),
  room_number VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  status room_status DEFAULT 'available',
  cleaning_status cleaning_status DEFAULT 'clean',
  is_smoking BOOLEAN DEFAULT false,
  is_accessible BOOLEAN DEFAULT false,
  floor_number INTEGER,
  notes TEXT,
  qr_code TEXT,
  last_cleaned_at TIMESTAMPTZ,
  last_inspected_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, room_number)
);

-- ============================================================
-- GUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id),
  hotel_id UUID REFERENCES hotels(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  date_of_birth DATE,
  nationality VARCHAR(100),
  id_type VARCHAR(50),
  id_number VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  vip_status BOOLEAN DEFAULT false,
  blacklisted BOOLEAN DEFAULT false,
  notes TEXT,
  preferences JSONB DEFAULT '{}',
  total_stays INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_stay_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DISCOUNTS & COUPONS
-- ============================================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' | 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  min_nights INTEGER DEFAULT 1,
  min_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  applicable_room_types UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RESERVATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id),
  confirmation_number VARCHAR(20) UNIQUE NOT NULL,
  guest_id UUID REFERENCES guests(id),
  profile_id UUID REFERENCES profiles(id),
  room_id UUID REFERENCES rooms(id),
  room_type_id UUID REFERENCES room_types(id),
  coupon_id UUID REFERENCES coupons(id),
  -- Dates
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  actual_check_in TIMESTAMPTZ,
  actual_check_out TIMESTAMPTZ,
  nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
  -- Guests
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  -- Pricing
  room_rate DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  -- Status
  status reservation_status DEFAULT 'pending',
  -- Extras
  extras JSONB DEFAULT '[]', -- [{name, price, quantity}]
  special_requests TEXT,
  internal_notes TEXT,
  source VARCHAR(50) DEFAULT 'direct', -- 'direct', 'walk_in', 'ota', 'phone'
  -- Metadata
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_reservations_hotel_id ON reservations(hotel_id);
CREATE INDEX idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX idx_reservations_room_id ON reservations(room_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_check_in ON reservations(check_in_date);
CREATE INDEX idx_reservations_check_out ON reservations(check_out_date);
CREATE INDEX idx_reservations_confirmation ON reservations(confirmation_number);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type payment_method_type NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  reservation_id UUID NOT NULL REFERENCES reservations(id),
  guest_id UUID REFERENCES guests(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'PHP',
  status payment_status DEFAULT 'pending',
  transaction_id VARCHAR(255),
  gateway VARCHAR(50), -- 'stripe', 'paymongo', 'cash', etc.
  gateway_response JSONB DEFAULT '{}',
  notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  reservation_id UUID REFERENCES reservations(id),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status payment_status DEFAULT 'pending',
  transaction_id VARCHAR(255),
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  reservation_id UUID REFERENCES reservations(id),
  guest_id UUID REFERENCES guests(id),
  profile_id UUID REFERENCES profiles(id),
  overall_rating SMALLINT CHECK (overall_rating BETWEEN 1 AND 5),
  cleanliness_rating SMALLINT CHECK (cleanliness_rating BETWEEN 1 AND 5),
  service_rating SMALLINT CHECK (service_rating BETWEEN 1 AND 5),
  comfort_rating SMALLINT CHECK (comfort_rating BETWEEN 1 AND 5),
  value_rating SMALLINT CHECK (value_rating BETWEEN 1 AND 5),
  location_rating SMALLINT CHECK (location_rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  body TEXT,
  pros TEXT,
  cons TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  response TEXT, -- Hotel response
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES profiles(id),
  sentiment_score DECIMAL(3,2), -- AI sentiment -1 to 1
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GALLERY
-- ============================================================

CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  room_type_id UUID REFERENCES room_types(id),
  title VARCHAR(255),
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  category VARCHAR(50), -- 'rooms', 'lobby', 'restaurant', 'pool', 'spa', 'exterior'
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HOUSEKEEPING
-- ============================================================

CREATE TABLE IF NOT EXISTS housekeeping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  reservation_id UUID REFERENCES reservations(id),
  assigned_to UUID REFERENCES profiles(id),
  priority SMALLINT DEFAULT 1, -- 1=low, 2=medium, 3=high
  type VARCHAR(50) DEFAULT 'regular', -- 'checkout', 'stayover', 'deep_clean', 'inspection'
  status cleaning_status DEFAULT 'dirty',
  scheduled_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  checklist JSONB DEFAULT '[]', -- [{item, checked, notes}]
  photos JSONB DEFAULT '[]', -- [{url, caption}]
  notes TEXT,
  inspector_id UUID REFERENCES profiles(id),
  inspected_at TIMESTAMPTZ,
  inspection_notes TEXT,
  inspection_passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_housekeeping_room_id ON housekeeping(room_id);
CREATE INDEX idx_housekeeping_assigned_to ON housekeeping(assigned_to);
CREATE INDEX idx_housekeeping_status ON housekeeping(status);

-- ============================================================
-- MAINTENANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  room_id UUID REFERENCES rooms(id),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'plumbing', 'electrical', 'hvac', 'furniture', 'other'
  priority maintenance_priority DEFAULT 'medium',
  status maintenance_status DEFAULT 'open',
  assigned_to UUID REFERENCES profiles(id),
  reported_by UUID REFERENCES profiles(id),
  images JSONB DEFAULT '[]',
  cost DECIMAL(10,2),
  estimated_completion DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_room_id ON maintenance(room_id);
CREATE INDEX idx_maintenance_status ON maintenance(status);
CREATE INDEX idx_maintenance_priority ON maintenance(priority);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  category inventory_category NOT NULL,
  unit VARCHAR(50) DEFAULT 'piece',
  quantity DECIMAL(10,2) DEFAULT 0,
  min_quantity DECIMAL(10,2) DEFAULT 10,
  reorder_quantity DECIMAL(10,2) DEFAULT 50,
  unit_cost DECIMAL(10,2),
  supplier VARCHAR(255),
  supplier_contact TEXT,
  location VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  hotel_id UUID REFERENCES hotels(id),
  type stock_movement_type NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_id UUID, -- reservation_id, purchase_order_id, etc.
  reference_type VARCHAR(50),
  notes TEXT,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STAFF & ATTENDANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id),
  hotel_id UUID REFERENCES hotels(id),
  employee_id VARCHAR(50) UNIQUE,
  department VARCHAR(100),
  position VARCHAR(100),
  shift VARCHAR(50), -- 'morning', 'afternoon', 'night'
  hire_date DATE,
  salary DECIMAL(10,2),
  emergency_contact JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id),
  hotel_id UUID REFERENCES hotels(id),
  date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'present', -- 'present', 'absent', 'late', 'leave'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  user_id UUID REFERENCES profiles(id),
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================
-- AUDIT & ACTIVITY LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, key)
);

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  guest_id UUID REFERENCES guests(id),
  profile_id UUID REFERENCES profiles(id),
  reservation_id UUID REFERENCES reservations(id),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_to UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMAIL & SMS LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  template VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  provider VARCHAR(50) DEFAULT 'resend',
  provider_id VARCHAR(255),
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id),
  recipient_phone VARCHAR(50) NOT NULL,
  message TEXT,
  template VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  provider VARCHAR(50),
  provider_id VARCHAR(255),
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS — updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'hotels', 'profiles', 'room_types', 'rooms', 'guests',
    'reservations', 'payments', 'reviews', 'housekeeping',
    'maintenance', 'inventory', 'staff', 'support_tickets'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- TRIGGER — auto-create profile on auth.users insert
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'guest'::public.user_role
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER — auto-generate confirmation numbers
-- ============================================================

CREATE OR REPLACE FUNCTION generate_confirmation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_number IS NULL OR NEW.confirmation_number = '' THEN
    NEW.confirmation_number := 'HRS' || TO_CHAR(NOW(), 'YYYYMMDD') || 
      LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reservation_confirmation ON reservations;
CREATE TRIGGER trg_reservation_confirmation
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION generate_confirmation_number();

-- ============================================================
-- TRIGGER — auto-generate maintenance ticket numbers
-- ============================================================

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := 'MNT' || TO_CHAR(NOW(), 'YYYYMMDD') || 
      LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_maintenance_ticket ON maintenance;
CREATE TRIGGER trg_maintenance_ticket
  BEFORE INSERT ON maintenance
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

CREATE OR REPLACE FUNCTION generate_support_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := 'SUP' || TO_CHAR(NOW(), 'YYYYMMDD') || 
      LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_ticket ON support_tickets;
CREATE TRIGGER trg_support_ticket
  BEFORE INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION generate_support_ticket_number();

-- ============================================================
-- SEED — Roles
-- ============================================================

INSERT INTO roles (name, display_name, description, is_system) VALUES
  ('guest',         'Guest',         'Hotel guests with booking capabilities',         true),
  ('receptionist',  'Receptionist',  'Front desk staff managing check-ins/check-outs', true),
  ('housekeeping',  'Housekeeping',  'Room cleaning and inspection staff',              true),
  ('cashier',       'Cashier',       'Payment processing staff',                        true),
  ('maintenance',   'Maintenance',   'Facility maintenance technicians',                true),
  ('manager',       'Manager',       'Hotel operations manager',                        true),
  ('super_admin',   'Super Admin',   'Full system access',                              true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED — Payment Methods
-- ============================================================

INSERT INTO payment_methods (name, type) VALUES
  ('Cash',           'cash'),
  ('Credit Card',    'credit_card'),
  ('Debit Card',     'debit_card'),
  ('GCash',          'gcash'),
  ('Maya',           'maya'),
  ('Bank Transfer',  'bank_transfer'),
  ('PayPal',         'paypal')
ON CONFLICT DO NOTHING;


