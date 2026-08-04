import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/helpdesk";

function nameFromUser(user: User): string {
  const m = (user.user_metadata ?? {}) as Record<string, unknown>;
  const pick = (k: string) => {
    const v = m[k];
    return typeof v === "string" && v.trim() ? v.trim() : "";
  };
  const composed = [pick("given_name"), pick("family_name")].filter(Boolean).join(" ");
  return (
    pick("full_name") ||
    pick("name") ||
    composed ||
    (user.email ?? "").split("@")[0] ||
    ""
  );
}

/** Keeps public.profiles in sync with the identity provider (Google, email) data. */
async function syncProfile(user: User) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return;

  const desiredName = nameFromUser(user);
  const desiredEmail = user.email ?? "";
  const patch: { full_name?: string; email?: string } = {};
  if (desiredName && !data.full_name?.trim()) patch.full_name = desiredName;
  if (desiredEmail && data.email !== desiredEmail) patch.email = desiredEmail;
  if (Object.keys(patch).length === 0) return;

  await supabase.from("profiles").update(patch).eq("id", user.id);
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = (s: Session | null) => {
      setSession(s);
      setLoading(false);
      if (s?.user) void syncProfile(s.user);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => handle(s));
    supabase.auth.getSession().then(({ data }) => handle(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
}


export function useRoles(userId?: string) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (!active) return;
        setRoles((data ?? []).map((r) => r.role as Role));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return { roles, loading };
}
