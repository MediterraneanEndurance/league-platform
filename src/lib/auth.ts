import { allowLocalAuthFallback, createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { UserRole } from "@/types/league";
export { canAccessAdmin, canAccessSteward } from "@/lib/roles";

export type AuthState = {
  configured: boolean;
  role: UserRole;
  userId?: string;
  email?: string;
};

export async function getAuthState(): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { configured: false, role: allowLocalAuthFallback() ? "admin" : "viewer" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { configured: false, role: allowLocalAuthFallback() ? "admin" : "viewer" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { configured: true, role: "viewer" };

  const { data } = await supabase.from("users").select("role,email").eq("id", user.id).maybeSingle();

  return {
    configured: true,
    role: (data?.role as UserRole | undefined) ?? "viewer",
    userId: user.id,
    email: data?.email ?? user.email,
  };
}
