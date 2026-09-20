export type UserRole =
  | "guest"
  | "receptionist"
  | "housekeeping"
  | "cashier"
  | "maintenance"
  | "manager"
  | "super_admin";

export type ReservationStatus =
  | "pending" | "confirmed" | "checked_in"
  | "checked_out" | "cancelled" | "no_show" | "waitlisted";

export type RoomStatus =
  | "available" | "occupied" | "reserved"
  | "maintenance" | "out_of_order" | "cleaning";

export type CleaningStatus =
  | "clean" | "dirty" | "in_progress" | "inspected" | "do_not_disturb";

export type PaymentStatus =
  | "pending" | "processing" | "completed"
  | "failed" | "refunded" | "partially_refunded" | "cancelled";

export type MaintenancePriority = "low" | "medium" | "high" | "critical";
export type MaintenanceStatus = "open" | "in_progress" | "resolved" | "closed" | "deferred";

// ── Core entities ─────────────────────────────────────────────

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  star_rating?: number;
  check_in_time?: string;
  check_out_time?: string;
  timezone?: string;
  currency?: string;
  logo_url?: string;
  cover_url?: string;
  settings?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  hotel_id?: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  nationality?: string;
  id_type?: string;
  id_number?: string;
  address?: string;
  preferences?: Record<string, unknown>;
  notification_settings?: NotificationSettings;
  two_factor_enabled?: boolean;
  last_login_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  booking_updates: boolean;
  promotions: boolean;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  max_occupancy: number;
  max_adults: number;
  max_children: number;
  size_sqm?: number;
  bed_type?: string;
  base_price: number;
  weekend_price?: number;
  seasonal_price?: SeasonalPrice[];
  cancellation_policy?: string;
  cover_image_url?: string;
  images?: string[];
  features?: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Relations
  amenities?: Amenity[];
}

export interface SeasonalPrice {
  start: string;
  end: string;
  price: number;
  label?: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  floor_id?: string;
  room_type_id: string;
  room_number: string;
  name?: string;
  status: RoomStatus;
  cleaning_status: CleaningStatus;
  is_smoking: boolean;
  is_accessible: boolean;
  floor_number?: number;
  notes?: string;
  qr_code?: string;
  last_cleaned_at?: string;
  last_inspected_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  room_type?: RoomType;
  floor?: Floor;
}

export interface Floor {
  id: string;
  hotel_id: string;
  number: number;
  name?: string;
  is_active: boolean;
}

export interface Amenity {
  id: string;
  hotel_id?: string;
  name: string;
  icon?: string;
  category?: string;
  description?: string;
  is_active: boolean;
}

export interface Guest {
  id: string;
  profile_id?: string;
  hotel_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  id_type?: string;
  id_number?: string;
  address?: string;
  city?: string;
  country?: string;
  vip_status: boolean;
  blacklisted: boolean;
  notes?: string;
  preferences?: Record<string, unknown>;
  total_stays: number;
  total_spent: number;
  last_stay_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  hotel_id: string;
  confirmation_number: string;
  guest_id?: string;
  profile_id?: string;
  room_id?: string;
  room_type_id?: string;
  coupon_id?: string;
  check_in_date: string;
  check_out_date: string;
  actual_check_in?: string;
  actual_check_out?: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  room_rate: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: ReservationStatus;
  extras?: Extra[];
  special_requests?: string;
  internal_notes?: string;
  source: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  // Relations
  guest?: Guest;
  room?: Room;
  room_type?: RoomType;
  payments?: Payment[];
}

export interface Extra {
  name: string;
  price: number;
  quantity: number;
}

export interface Payment {
  id: string;
  hotel_id?: string;
  reservation_id: string;
  guest_id?: string;
  payment_method_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transaction_id?: string;
  gateway?: string;
  gateway_response?: Record<string, unknown>;
  notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  payment_method?: PaymentMethod;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

export interface Review {
  id: string;
  hotel_id?: string;
  reservation_id?: string;
  guest_id?: string;
  profile_id?: string;
  overall_rating: number;
  cleanliness_rating?: number;
  service_rating?: number;
  comfort_rating?: number;
  value_rating?: number;
  location_rating?: number;
  title?: string;
  body?: string;
  pros?: string;
  cons?: string;
  is_verified: boolean;
  is_published: boolean;
  response?: string;
  responded_at?: string;
  sentiment_score?: number;
  created_at: string;
  // Relations
  guest?: Guest;
}

export interface HousekeepingTask {
  id: string;
  hotel_id?: string;
  room_id: string;
  reservation_id?: string;
  assigned_to?: string;
  priority: number;
  type: "checkout" | "stayover" | "deep_clean" | "inspection" | "regular";
  status: CleaningStatus;
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  checklist?: ChecklistItem[];
  photos?: Photo[];
  notes?: string;
  inspector_id?: string;
  inspected_at?: string;
  inspection_notes?: string;
  inspection_passed?: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  room?: Room;
  assignee?: Profile;
}

export interface ChecklistItem {
  item: string;
  checked: boolean;
  notes?: string;
}

export interface Photo {
  url: string;
  caption?: string;
}

export interface MaintenanceTicket {
  id: string;
  hotel_id?: string;
  room_id?: string;
  ticket_number: string;
  title: string;
  description?: string;
  category?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assigned_to?: string;
  reported_by?: string;
  images?: Photo[];
  cost?: number;
  estimated_completion?: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
  // Relations
  room?: Room;
  assignee?: Profile;
}

export interface InventoryItem {
  id: string;
  hotel_id?: string;
  name: string;
  sku?: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  reorder_quantity: number;
  unit_cost?: number;
  supplier?: string;
  location?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  hotel_id?: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  hotel_id?: string;
  code: string;
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_nights: number;
  min_amount: number;
  max_uses?: number;
  used_count: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  hotel_id?: string;
  room_type_id?: string;
  title?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  category?: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

// ── API Response types ────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: "success" | "error";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── Dashboard / Analytics types ───────────────────────────────

export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  pendingReservations: number;
  todayRevenue: number;
  monthRevenue: number;
  totalGuests: number;
  avgRating: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  bookings: number;
}

export interface OccupancyDataPoint {
  date: string;
  rate: number;
  occupied: number;
  total: number;
}

// ── Booking Engine types ──────────────────────────────────────

export interface BookingSearchParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  promoCode?: string;
}

export interface BookingFormData {
  roomTypeId: string;
  roomId?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  infants: number;
  extras: Extra[];
  specialRequests?: string;
  promoCode?: string;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality?: string;
    idType?: string;
    idNumber?: string;
  };
  paymentMethodId?: string;
}

// ── Dev Module types ──────────────────────────────────────────

export type TestStatus = "idle" | "running" | "success" | "error";

export interface TestResult {
  name: string;
  status: TestStatus;
  message?: string;
  details?: string;
  executionTime?: number;
  timestamp?: string;
}
