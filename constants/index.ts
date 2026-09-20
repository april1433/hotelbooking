// App-wide constants for the Hotel PMS

export const APP_NAME = process.env.NEXT_PUBLIC_HOTEL_NAME ?? "Grand Azure Hotel";
export const APP_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ── Role display names ─────────────────────────────────────────
export const ROLE_LABELS: Record<string, string> = {
  guest:         "Guest",
  receptionist:  "Receptionist",
  housekeeping:  "Housekeeping",
  cashier:       "Cashier",
  maintenance:   "Maintenance",
  manager:       "Manager",
  super_admin:   "Super Admin",
};

export const ROLE_COLORS: Record<string, string> = {
  guest:         "bg-blue-100 text-blue-700",
  receptionist:  "bg-teal-100 text-teal-700",
  housekeeping:  "bg-purple-100 text-purple-700",
  cashier:       "bg-emerald-100 text-emerald-700",
  maintenance:   "bg-orange-100 text-orange-700",
  manager:       "bg-amber-100 text-amber-700",
  super_admin:   "bg-red-100 text-red-700",
};

// ── Reservation status ─────────────────────────────────────────
export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending:     "Pending",
  confirmed:   "Confirmed",
  checked_in:  "Checked In",
  checked_out: "Checked Out",
  cancelled:   "Cancelled",
  no_show:     "No Show",
  waitlisted:  "Waitlisted",
};

// ── Room status ────────────────────────────────────────────────
export const ROOM_STATUS_LABELS: Record<string, string> = {
  available:    "Available",
  occupied:     "Occupied",
  reserved:     "Reserved",
  maintenance:  "Maintenance",
  out_of_order: "Out of Order",
  cleaning:     "Cleaning",
};

// ── Cleaning status ────────────────────────────────────────────
export const CLEANING_STATUS_LABELS: Record<string, string> = {
  clean:          "Clean",
  dirty:          "Dirty",
  in_progress:    "In Progress",
  inspected:      "Inspected",
  do_not_disturb: "Do Not Disturb",
};

// ── Maintenance ────────────────────────────────────────────────
export const MAINTENANCE_PRIORITY_LABELS: Record<string, string> = {
  low:      "Low",
  medium:   "Medium",
  high:     "High",
  critical: "Critical",
};

export const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  closed:      "Closed",
  deferred:    "Deferred",
};

// ── Booking sources ────────────────────────────────────────────
export const BOOKING_SOURCES: Record<string, string> = {
  direct:     "Direct (Website)",
  walk_in:    "Walk-In",
  ota:        "OTA (Booking.com / Agoda)",
  phone:      "Phone",
  email:      "Email",
  corporate:  "Corporate",
};

// ── Room amenity categories ────────────────────────────────────
export const AMENITY_CATEGORIES = [
  { value: "room",      label: "In-Room" },
  { value: "bathroom",  label: "Bathroom" },
  { value: "tech",      label: "Technology" },
  { value: "hotel",     label: "Hotel Facilities" },
  { value: "dining",    label: "Dining" },
  { value: "wellness",  label: "Wellness" },
];

// ── Pagination defaults ───────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ── Tax rate ──────────────────────────────────────────────────
export const TAX_RATE = 0.12; // 12% VAT (Philippines)

// ── Extra services ────────────────────────────────────────────
export const BOOKING_EXTRAS = [
  { id: "breakfast",      name: "Daily Breakfast",         price: 650 },
  { id: "airport_pickup", name: "Airport Pickup",           price: 1200 },
  { id: "extra_bed",      name: "Extra Bed",                price: 800 },
  { id: "late_checkout",  name: "Late Checkout (until 3PM)", price: 500 },
  { id: "early_checkin",  name: "Early Check-In (from 10AM)", price: 500 },
  { id: "spa",            name: "Spa Package (1hr)",         price: 1500 },
];

// ── Gallery categories ─────────────────────────────────────────
export const GALLERY_CATEGORIES = [
  { value: "rooms",     label: "Rooms & Suites" },
  { value: "lobby",     label: "Lobby & Common Areas" },
  { value: "restaurant",label: "Restaurant" },
  { value: "pool",      label: "Pool & Recreation" },
  { value: "spa",       label: "Spa & Wellness" },
  { value: "exterior",  label: "Exterior" },
  { value: "events",    label: "Events & Meetings" },
];

// ── Nav items ─────────────────────────────────────────────────
export const PUBLIC_NAV = [
  { label: "Home",      href: "/" },
  { label: "Rooms",     href: "/rooms" },
  { label: "Amenities", href: "/amenities" },
  { label: "Gallery",   href: "/gallery" },
  { label: "Contact",   href: "/contact" },
];

// ── Sidebar nav for each role ─────────────────────────────────
export const GUEST_NAV = [
  { label: "Dashboard",     href: "/guest/dashboard",      icon: "LayoutDashboard" },
  { label: "Reservations",  href: "/guest/reservations",   icon: "CalendarDays" },
  { label: "Invoices",      href: "/guest/invoices",        icon: "Receipt" },
  { label: "Reviews",       href: "/guest/reviews",         icon: "Star" },
  { label: "Profile",       href: "/guest/profile",         icon: "User" },
  { label: "Notifications", href: "/guest/notifications",   icon: "Bell" },
];

export const RECEPTION_NAV = [
  { label: "Dashboard",     href: "/staff/reception",              icon: "LayoutDashboard" },
  { label: "Check-Ins",     href: "/staff/reception/checkins",     icon: "LogIn" },
  { label: "Check-Outs",    href: "/staff/reception/checkouts",    icon: "LogOut" },
  { label: "Reservations",  href: "/staff/reception/reservations", icon: "CalendarDays" },
  { label: "Walk-In",       href: "/staff/reception/walkin",       icon: "UserPlus" },
  { label: "Guests",        href: "/staff/reception/guests",       icon: "Users" },
];

export const HOUSEKEEPING_NAV = [
  { label: "Dashboard",     href: "/staff/housekeeping",           icon: "LayoutDashboard" },
  { label: "Cleaning Queue",href: "/staff/housekeeping/queue",     icon: "ClipboardList" },
  { label: "My Tasks",      href: "/staff/housekeeping/my-tasks",  icon: "CheckSquare" },
  { label: "Logs",          href: "/staff/housekeeping/logs",      icon: "History" },
];

export const MAINTENANCE_NAV = [
  { label: "Dashboard",     href: "/staff/maintenance",            icon: "LayoutDashboard" },
  { label: "Tickets",       href: "/staff/maintenance/tickets",    icon: "Wrench" },
  { label: "My Tickets",    href: "/staff/maintenance/my-tickets", icon: "ClipboardCheck" },
  { label: "History",       href: "/staff/maintenance/history",    icon: "History" },
];

export const ADMIN_NAV = [
  { label: "Dashboard",     href: "/admin/dashboard",      icon: "LayoutDashboard" },
  { label: "Reservations",  href: "/admin/reservations",   icon: "CalendarDays" },
  { label: "Rooms",         href: "/admin/rooms",           icon: "BedDouble" },
  { label: "Guests",        href: "/admin/guests",          icon: "Users" },
  { label: "Staff",         href: "/admin/staff",           icon: "UserCog" },
  { label: "Housekeeping",  href: "/admin/housekeeping",    icon: "Sparkles" },
  // { label: "Maintenance",   href: "/admin/maintenance",     icon: "Wrench" },
  { label: "Inventory",     href: "/admin/inventory",       icon: "Package" },
  { label: "Payments",      href: "/admin/payments",        icon: "CreditCard" },
  { label: "Reports",       href: "/admin/reports",         icon: "BarChart3" },
  // { label: "Analytics",     href: "/admin/analytics",       icon: "TrendingUp" },
  { label: "Notifications", href: "/admin/notifications",   icon: "Bell" },
  // { label: "Audit Logs",    href: "/admin/audit",           icon: "ShieldCheck" },
  { label: "Settings",      href: "/admin/settings",        icon: "Settings" },
];

export const DEFAULT_HOTEL = {
  id: "11111111-0000-0000-0000-000000000001",
  name: "Grand Azure Hotel & Resort",
  city: "Boracay",
  country: "Philippines",
};

export const DEFAULT_ROOM_TYPES = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    hotel_id: "11111111-0000-0000-0000-000000000001",
    name: "Deluxe Suite",
    slug: "deluxe-suite",
    description: "Spacious luxury suite featuring a private balcony and panoramic beach views.",
    base_price: 8500,
    max_occupancy: 3,
    max_adults: 2,
    max_children: 1,
    bed_type: "King",
    size_sqm: 45,
    hotels: { name: "Grand Azure Hotel & Resort" },
    is_active: true,
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    hotel_id: "11111111-0000-0000-0000-000000000001",
    name: "Ocean View Villa",
    slug: "ocean-view-villa",
    description: "Exclusive beachfront villa with direct ocean access and private plunge pool.",
    base_price: 15000,
    max_occupancy: 4,
    max_adults: 3,
    max_children: 2,
    bed_type: "King",
    size_sqm: 85,
    hotels: { name: "Grand Azure Hotel & Resort" },
    is_active: true,
  },
  {
    id: "a3333333-3333-3333-3333-333333333333",
    hotel_id: "11111111-0000-0000-0000-000000000001",
    name: "Executive King",
    slug: "executive-king",
    description: "Modern upscale room tailored for executives and couples seeking premium comfort.",
    base_price: 6200,
    max_occupancy: 2,
    max_adults: 2,
    max_children: 0,
    bed_type: "King",
    size_sqm: 40,
    hotels: { name: "Grand Azure Hotel & Resort" },
    is_active: true,
  },
  {
    id: "a4444444-4444-4444-4444-444444444444",
    hotel_id: "11111111-0000-0000-0000-000000000001",
    name: "Standard Twin",
    slug: "standard-twin",
    description: "Comfortable twin room ideal for friends or small families.",
    base_price: 4500,
    max_occupancy: 2,
    max_adults: 2,
    max_children: 1,
    bed_type: "Twin",
    size_sqm: 35,
    hotels: { name: "Grand Azure Hotel & Resort" },
    is_active: true,
  },
  {
    id: "a5555555-5555-5555-5555-555555555555",
    hotel_id: "11111111-0000-0000-0000-000000000001",
    name: "Presidential Penthouse",
    slug: "presidential-penthouse",
    description: "Top-floor penthouse with 360 ocean view, jacuzzi, butler service, and private lounge.",
    base_price: 32000,
    max_occupancy: 6,
    max_adults: 4,
    max_children: 2,
    bed_type: "Super King",
    size_sqm: 140,
    hotels: { name: "Grand Azure Hotel & Resort" },
    is_active: true,
  },
  {
    id: "a6666666-6666-6666-6666-666666666666",
    hotel_id: "11111111-0000-0000-0000-000000000001",
    name: "Garden Bungalow",
    slug: "garden-bungalow",
    description: "Tranquil tropical bungalow surrounded by flora with open-air rainfall shower.",
    base_price: 9800,
    max_occupancy: 3,
    max_adults: 2,
    max_children: 1,
    bed_type: "Queen",
    size_sqm: 55,
    hotels: { name: "Grand Azure Hotel & Resort" },
    is_active: true,
  },
];

