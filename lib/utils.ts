import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

// ── TailwindCSS class merge ────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date formatting ────────────────────────────────────────────
export function formatDate(date: string | Date, fmt = "MMM d, yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy h:mm a");
}

export function formatTimeAgo(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCurrency(amount: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-PH").format(n);
}

export function formatPercent(n: number, decimals = 1) {
  return `${n.toFixed(decimals)}%`;
}

// ── String utilities ───────────────────────────────────────────
export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function titleCase(str: string) {
  return str.replace(/\b\w/g, (l) => l.toUpperCase());
}

export function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Number utilities ───────────────────────────────────────────
export function calculateNights(checkIn: string, checkOut: string) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// ── Status helpers ─────────────────────────────────────────────
export function getRoomStatusColor(status: string) {
  const map: Record<string, string> = {
    available:    "badge-available",
    occupied:     "badge-occupied",
    reserved:     "badge-reserved",
    maintenance:  "badge-maintenance",
    out_of_order: "badge-maintenance",
    cleaning:     "badge-cleaning",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function getReservationStatusColor(status: string) {
  const map: Record<string, string> = {
    pending:     "badge-pending",
    confirmed:   "badge-confirmed",
    checked_in:  "badge-checked-in",
    checked_out: "badge-checked-out",
    cancelled:   "badge-cancelled",
    no_show:     "badge-maintenance",
    waitlisted:  "badge-pending",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function getMaintenancePriorityColor(priority: string) {
  const map: Record<string, string> = {
    low:      "bg-green-100 text-green-700",
    medium:   "bg-amber-100 text-amber-700",
    high:     "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };
  return map[priority] ?? "bg-gray-100 text-gray-700";
}

// ── Avatar fallback color ──────────────────────────────────────
export function getAvatarColor(name: string) {
  const colors = [
    "bg-navy-600", "bg-gold-600", "bg-emerald-600",
    "bg-purple-600", "bg-rose-600", "bg-cyan-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ── Error helpers ──────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}

// ── Debounce ───────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Generate random confirmation number ───────────────────────
export function generateConfirmationNumber() {
  const date = format(new Date(), "yyyyMMdd");
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `HRS${date}${rand}`;
}

// ── Occupancy rate ────────────────────────────────────────────
export function calculateOccupancyRate(occupied: number, total: number) {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100 * 10) / 10;
}

// ── Sleep (for testing/animation) ────────────────────────────
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
