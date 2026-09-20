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
