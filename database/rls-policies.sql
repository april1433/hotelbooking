-- ============================================================
-- Row Level Security Policies
-- Hotel PMS — Version 1.0.0
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_type_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is staff (receptionist or above)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN (
    'receptionist', 'housekeeping', 'cashier',
    'maintenance', 'manager', 'super_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is manager or above
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('manager', 'super_admin');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'super_admin';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Staff can read all profiles
CREATE POLICY "profiles_select_staff" ON profiles
  FOR SELECT USING (is_staff());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Guests cannot change their own role
    (get_user_role() != 'guest' OR role = 'guest')
  );

-- Super admin can manage all profiles
CREATE POLICY "profiles_all_super_admin" ON profiles
  FOR ALL USING (is_super_admin());

-- ============================================================
-- HOTELS POLICIES
-- ============================================================

CREATE POLICY "hotels_select_all" ON hotels
  FOR SELECT USING (true); -- Public info

CREATE POLICY "hotels_modify_super_admin" ON hotels
  FOR ALL USING (is_super_admin());

-- ============================================================
-- ROOM TYPES & ROOMS POLICIES
-- ============================================================

-- Public can view active room types
CREATE POLICY "room_types_select_public" ON room_types
  FOR SELECT USING (is_active = true);

CREATE POLICY "room_types_modify_manager" ON room_types
  FOR ALL USING (is_manager());

-- Public can view available rooms (limited fields via views)
CREATE POLICY "rooms_select_staff" ON rooms
  FOR SELECT USING (is_staff() OR status = 'available');

CREATE POLICY "rooms_modify_manager" ON rooms
  FOR ALL USING (is_manager());

-- ============================================================
-- FLOORS POLICIES
-- ============================================================

CREATE POLICY "floors_select_staff" ON floors
  FOR SELECT USING (is_staff());

CREATE POLICY "floors_modify_manager" ON floors
  FOR ALL USING (is_manager());

-- ============================================================
-- AMENITIES POLICIES
-- ============================================================

CREATE POLICY "amenities_select_all" ON amenities
  FOR SELECT USING (true);

CREATE POLICY "amenities_modify_manager" ON amenities
  FOR ALL USING (is_manager());

CREATE POLICY "room_type_amenities_select_all" ON room_type_amenities
  FOR SELECT USING (true);

CREATE POLICY "room_type_amenities_modify_manager" ON room_type_amenities
  FOR ALL USING (is_manager());

-- ============================================================
-- GUESTS POLICIES
-- ============================================================

-- Guests can see their own guest record
CREATE POLICY "guests_select_own" ON guests
  FOR SELECT USING (profile_id = auth.uid());

-- Staff can see all guests
CREATE POLICY "guests_select_staff" ON guests
  FOR SELECT USING (is_staff());

-- Staff can modify guests
CREATE POLICY "guests_modify_staff" ON guests
  FOR ALL USING (
    get_user_role() IN ('receptionist', 'cashier', 'manager', 'super_admin')
  );

-- ============================================================
-- RESERVATIONS POLICIES
-- ============================================================

-- Guests can see their own reservations
CREATE POLICY "reservations_select_own" ON reservations
  FOR SELECT USING (profile_id = auth.uid());

-- Staff can see all reservations
CREATE POLICY "reservations_select_staff" ON reservations
  FOR SELECT USING (is_staff());

-- Guests can create reservations
CREATE POLICY "reservations_insert_guest" ON reservations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND profile_id = auth.uid()
  );

-- Receptionist+ can create/update reservations
CREATE POLICY "reservations_modify_staff" ON reservations
  FOR ALL USING (
    get_user_role() IN ('receptionist', 'cashier', 'manager', 'super_admin')
  );

-- ============================================================
-- PAYMENTS POLICIES
-- ============================================================

-- Guests can see own payments
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    reservation_id IN (
      SELECT id FROM reservations WHERE profile_id = auth.uid()
    )
  );

-- Cashier+ can see all payments
CREATE POLICY "payments_select_staff" ON payments
  FOR SELECT USING (
    get_user_role() IN ('cashier', 'manager', 'super_admin')
  );

-- Cashier+ can create/modify payments
CREATE POLICY "payments_modify_cashier" ON payments
  FOR ALL USING (
    get_user_role() IN ('cashier', 'manager', 'super_admin')
  );

CREATE POLICY "refunds_select_cashier" ON refunds
  FOR SELECT USING (
    get_user_role() IN ('cashier', 'manager', 'super_admin')
  );

CREATE POLICY "refunds_modify_manager" ON refunds
  FOR ALL USING (is_manager());

-- ============================================================
-- REVIEWS POLICIES
-- ============================================================

-- Published reviews are public
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT USING (is_published = true);

-- Guests can see their own reviews (even unpublished)
CREATE POLICY "reviews_select_own" ON reviews
  FOR SELECT USING (profile_id = auth.uid());

-- Guests can create reviews for their own reservations
CREATE POLICY "reviews_insert_guest" ON reviews
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() AND
    reservation_id IN (
      SELECT id FROM reservations 
      WHERE profile_id = auth.uid() AND status = 'checked_out'
    )
  );

-- Manager can manage all reviews
CREATE POLICY "reviews_modify_manager" ON reviews
  FOR ALL USING (is_manager());

-- ============================================================
-- GALLERY POLICIES
-- ============================================================

CREATE POLICY "gallery_select_public" ON gallery
  FOR SELECT USING (is_active = true);

CREATE POLICY "gallery_modify_manager" ON gallery
  FOR ALL USING (is_manager());

-- ============================================================
-- HOUSEKEEPING POLICIES
-- ============================================================

-- Housekeeping staff can see tasks assigned to them
CREATE POLICY "housekeeping_select_own" ON housekeeping
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    get_user_role() IN ('manager', 'super_admin', 'receptionist')
  );

-- Housekeeping can update their own tasks
CREATE POLICY "housekeeping_update_own" ON housekeeping
  FOR UPDATE USING (
    assigned_to = auth.uid() OR is_manager()
  );

-- Manager creates/assigns housekeeping tasks
CREATE POLICY "housekeeping_insert_manager" ON housekeeping
  FOR INSERT WITH CHECK (is_staff());

CREATE POLICY "housekeeping_delete_manager" ON housekeeping
  FOR DELETE USING (is_manager());

-- ============================================================
-- MAINTENANCE POLICIES
-- ============================================================

-- Maintenance staff can see their own tickets
CREATE POLICY "maintenance_select_own" ON maintenance
  FOR SELECT USING (
    assigned_to = auth.uid() OR is_staff()
  );

-- Staff can create tickets, maintenance can update theirs
CREATE POLICY "maintenance_insert_staff" ON maintenance
  FOR INSERT WITH CHECK (is_staff());

CREATE POLICY "maintenance_update_own" ON maintenance
  FOR UPDATE USING (
    assigned_to = auth.uid() OR is_manager()
  );

CREATE POLICY "maintenance_delete_manager" ON maintenance
  FOR DELETE USING (is_manager());

-- ============================================================
-- INVENTORY POLICIES
-- ============================================================

CREATE POLICY "inventory_select_staff" ON inventory
  FOR SELECT USING (is_staff());

CREATE POLICY "inventory_modify_manager" ON inventory
  FOR ALL USING (is_manager());

CREATE POLICY "inventory_logs_select_staff" ON inventory_logs
  FOR SELECT USING (is_staff());

CREATE POLICY "inventory_logs_insert_staff" ON inventory_logs
  FOR INSERT WITH CHECK (is_staff());

-- ============================================================
-- STAFF & ATTENDANCE POLICIES
-- ============================================================

CREATE POLICY "staff_select_manager" ON staff
  FOR SELECT USING (is_manager());

CREATE POLICY "staff_select_own" ON staff
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "staff_modify_manager" ON staff
  FOR ALL USING (is_manager());

CREATE POLICY "attendance_select_own" ON attendance
  FOR SELECT USING (
    staff_id IN (SELECT id FROM staff WHERE profile_id = auth.uid())
    OR is_manager()
  );

CREATE POLICY "attendance_modify_manager" ON attendance
  FOR ALL USING (is_manager());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

-- Users only see their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System/staff can create notifications for anyone
CREATE POLICY "notifications_insert_staff" ON notifications
  FOR INSERT WITH CHECK (is_staff() OR auth.uid() IS NOT NULL);

-- ============================================================
-- AUDIT LOGS POLICIES
-- ============================================================

CREATE POLICY "audit_logs_select_manager" ON audit_logs
  FOR SELECT USING (is_manager());

CREATE POLICY "audit_logs_insert_authenticated" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "activity_logs_select_manager" ON activity_logs
  FOR SELECT USING (is_manager());

CREATE POLICY "activity_logs_insert_authenticated" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- SETTINGS POLICIES
-- ============================================================

-- Public settings visible to all
CREATE POLICY "settings_select_public" ON settings
  FOR SELECT USING (is_public = true);

-- Staff can see non-public settings
CREATE POLICY "settings_select_staff" ON settings
  FOR SELECT USING (is_staff() AND is_public = false);

-- Only managers can modify settings
CREATE POLICY "settings_modify_manager" ON settings
  FOR ALL USING (is_manager());

-- ============================================================
-- SUPPORT TICKETS POLICIES
-- ============================================================

CREATE POLICY "support_tickets_select_own" ON support_tickets
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "support_tickets_select_staff" ON support_tickets
  FOR SELECT USING (is_staff());

CREATE POLICY "support_tickets_insert_authenticated" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "support_tickets_modify_staff" ON support_tickets
  FOR UPDATE USING (is_staff());

-- ============================================================
-- EMAIL & SMS LOGS POLICIES
-- ============================================================

CREATE POLICY "email_logs_select_manager" ON email_logs
  FOR SELECT USING (is_manager());

CREATE POLICY "email_logs_insert_system" ON email_logs
  FOR INSERT WITH CHECK (is_staff());

CREATE POLICY "sms_logs_select_manager" ON sms_logs
  FOR SELECT USING (is_manager());

CREATE POLICY "sms_logs_insert_system" ON sms_logs
  FOR INSERT WITH CHECK (is_staff());

-- ============================================================
-- COUPONS POLICIES
-- ============================================================

-- Anyone authenticated can select active coupons (for validation)
CREATE POLICY "coupons_select_authenticated" ON coupons
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "coupons_select_manager" ON coupons
  FOR SELECT USING (is_manager());

CREATE POLICY "coupons_modify_manager" ON coupons
  FOR ALL USING (is_manager());
