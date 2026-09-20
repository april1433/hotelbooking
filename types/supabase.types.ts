// Placeholder — run `npx supabase gen types typescript --project-id YOUR_ID > types/supabase.types.ts`
// Until then, using an open type so TypeScript allows full Supabase operations

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export type Enums = {
  user_role: "guest" | "receptionist" | "housekeeping" | "cashier" | "maintenance" | "manager" | "super_admin";
  reservation_status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show" | "waitlisted";
  room_status: "available" | "occupied" | "reserved" | "maintenance" | "out_of_order" | "cleaning";
  cleaning_status: "clean" | "dirty" | "in_progress" | "inspected" | "do_not_disturb";
  payment_status: "pending" | "processing" | "completed" | "failed" | "refunded" | "partially_refunded" | "cancelled";
  maintenance_priority: "low" | "medium" | "high" | "critical";
  maintenance_status: "open" | "in_progress" | "resolved" | "closed" | "deferred";
};
