"use client";

import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { ADMIN_NAV } from "@/constants";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/app/loading";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isStaff } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isStaff)) {
      router.push("/auth/login");
    }
  }, [user, loading, isStaff, router]);

  if (loading || !user || !profile || !isStaff) {
    return <Loading />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cream-100 dark:bg-charcoal-950 font-sans">
      <Sidebar navItems={ADMIN_NAV} user={profile} title="Staff Workspace" />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-none">
          {children}
        </main>
      </div>
    </div>
  );
}
