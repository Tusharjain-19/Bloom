import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "customer" | "salon_owner" | "admin";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!active) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess?.user) setRoles([]);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Fetch roles when user changes
  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!active) return;
        setRoles((data ?? []).map((r) => r.role as AppRole));
      });
    return () => {
      active = false;
    };
  }, [user]);

  return {
    session,
    user,
    roles,
    loading,
    isAuthenticated: !!user,
    isSalonOwner: roles.includes("salon_owner"),
    isAdmin: roles.includes("admin"),
  };
}
