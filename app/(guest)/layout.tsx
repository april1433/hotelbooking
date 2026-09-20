"use client";

import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { GUEST_NAV } from "@/constants";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/app/loading";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading || !user || !profile) {
    return <Loading />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cream-100 dark:bg-charcoal-950 font-sans">
      <Sidebar navItems={GUEST_NAV} user={profile} title="Guest Portal" />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-none">
          {children}
        </main>
      </div>
    </div>
  );
}
