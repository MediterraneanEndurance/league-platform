import { unstable_rethrow } from "next/navigation";
import { allowLocalAuthFallback, createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { UserRole } from "@/types/league";
export { canAccessAdmin, canAccessSteward } from "@/lib/roles";

export type AuthState = {
  configured: boolean;
  role: UserRole;
  userId?: string;
  email?: string;
};

function fallbackAuthState(configured = isSupabaseConfigured()): AuthState {
  return { configured, role: allowLocalAuthFallback() ? "admin" : "viewer" };
}

export async function getAuthState(): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return fallbackAuthState(false);
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return fallbackAuthState(false);

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
  } catch (error) {
    unstable_rethrow(error);
    console.error("Auth state failed to load", error);
    return fallbackAuthState(true);
  }
}
