"use client";

import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { RECEPTION_NAV, HOUSEKEEPING_NAV, MAINTENANCE_NAV } from "@/constants";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/app/loading";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, role, isStaff } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isStaff)) {
      router.push("/auth/login");
    }
  }, [user, loading, isStaff, router]);

  if (loading || !user || !profile || !isStaff) {
    return <Loading />;
  }

  // Determine which sidebar items to show based on staff role
  let navItems = RECEPTION_NAV;
  let title = "Reception Desk";

  if (role === "housekeeping") {
    navItems = HOUSEKEEPING_NAV;
    title = "Housekeeping Workspace";
  } else if (role === "maintenance") {
    navItems = MAINTENANCE_NAV;
    title = "Maintenance Console";
  } else if (role === "cashier") {
    // Cashier can use RECEPTION_NAV or we can build cashier specific dashboard
    title = "Cashier Station";
  } else if (role === "manager" || role === "super_admin") {
    title = "Staff Workspace";
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cream-100 dark:bg-charcoal-950 font-sans">
      <Sidebar navItems={navItems} user={profile} title={title} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-none">
          {children}
        </main>
      </div>
    </div>
  );
}
