"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  role: null,
  isAdmin: false,
  isStaff: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// Supabase client created once outside the component (module-level singleton)
const supabase: SupabaseClient = createClient();

const EMAIL_ROLE_MAP: Record<string, UserRole> = {
  "super@grandazure.com": "super_admin",
  "admin@grandazure.com": "super_admin",
  "admin2@grandazure.com": "super_admin",
  "manager@grandazure.com": "manager",
  "reception@grandazure.com": "receptionist",
  "housekeeping@grandazure.com": "housekeeping",
  "cashier@grandazure.com": "cashier",
  "maintenance@grandazure.com": "maintenance",
  "guest@grandazure.com": "guest",
};

function getFallbackRole(email?: string): UserRole {
  if (!email) return "guest";
  const lower = email.toLowerCase();
  return EMAIL_ROLE_MAP[lower] || (lower.endsWith("@grandazure.com") ? "guest" : "guest");
}

function buildFallbackProfile(user: User): Profile {
  const email = user.email || "";
  const role = getFallbackRole(email);
  const namePart = email ? email.split("@")[0] : "User";
  const capitalName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  return {
    id: user.id,
    hotel_id: "11111111-0000-0000-0000-000000000001",
    role,
    first_name: user.user_metadata?.first_name || capitalName,
    last_name: user.user_metadata?.last_name || "",
    display_name: user.user_metadata?.display_name || capitalName,
    email,
    is_active: true,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
        return;
      }
    } catch {
      // ignore
    }

    // Set fallback immediately so layouts and route guards never get stuck or redirect
    const fallback = buildFallbackProfile(currentUser);
    setProfile(fallback);

    // Asynchronously provision the profile row in Supabase
    if (currentUser.email) {
      try {
        fetch("/api/auth/provision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id, email: currentUser.email }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.role) {
              supabase
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .maybeSingle()
                .then(({ data: dbData }) => {
                  if (dbData) setProfile(dbData as Profile);
                });
            }
          })
          .catch(() => {});
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          await fetchProfile(initialSession.user);
        }
      } catch {
        // silently handle session errors
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          setLoading(true);
          await fetchProfile(currentSession.user);
          setLoading(false);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  const role = profile?.role ?? (user ? getFallbackRole(user.email) : null);
  const isAdmin = role === "super_admin" || role === "manager";
  const isStaff = [
    "receptionist", "housekeeping", "cashier",
    "maintenance", "manager", "super_admin",
  ].includes(role ?? "");

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, role, isAdmin, isStaff, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

