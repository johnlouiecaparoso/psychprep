import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LegacyRole, Profile, Role } from "@/lib/types";

function normalizeRole(role: LegacyRole | null | undefined): Role {
  return role === "instructor" ? "admin" : role === "admin" ? "admin" : "student";
}

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return {
      ...profile,
      role: normalizeRole(profile.role as LegacyRole)
    };
  }

  const fallbackRole = normalizeRole(
    typeof user.user_metadata?.role === "string" ? (user.user_metadata.role as LegacyRole) : "student"
  );

  return {
    id: user.id,
    full_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
    email: user.email ?? "",
    role: fallbackRole
  };
}

export async function requireRole(allowedRoles: Role[]) {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect("/dashboard");
  }

  return profile;
}
