"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { AuthActionState } from "./auth-types";



const getText = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

async function provisionPublicUser(userId: string, email: string) {
  const serviceClient = createSupabaseServiceClient();

  if (!serviceClient) {
    return "Account provisioning is temporarily unavailable.";
  }

  const { data: existingUser, error: readError } = await serviceClient
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (readError) return readError.message;
  if (existingUser) return "";

  const { error } = await serviceClient.from("users").insert({
    id: userId,
    email,
    role: "viewer",
  });

  return error?.message ?? "";
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Account registration is not open yet." };
  }

  const email = getText(formData, "email").toLowerCase();
  const password = getText(formData, "password");
  const confirmPassword = getText(formData, "confirm_password");

  if (!email || !password) return { ok: false, message: "Email and password are required." };
  if (password.length < 8) return { ok: false, message: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { ok: false, message: "Passwords do not match." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Account access is temporarily unavailable." };

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, message: error.message };
  if (!data.user) return { ok: false, message: "Signup did not return a user." };

  const provisioningError = await provisionPublicUser(data.user.id, data.user.email ?? email);
  if (provisioningError) return { ok: false, message: provisioningError };

  revalidatePath("/");
  revalidatePath("/register");

  return {
    ok: true,
    message: data.session
      ? "Account created. You are signed in with viewer access."
      : "Account created. Check your email if confirmation is enabled.",
  };
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Account access is temporarily unavailable." };
  }

  const email = getText(formData, "email").toLowerCase();
  const password = getText(formData, "password");

  if (!email || !password) return { ok: false, message: "Email and password are required." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Account access is temporarily unavailable." };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };

  if (data.user) {
    await provisionPublicUser(data.user.id, data.user.email ?? email);
  }

  revalidatePath("/");
  redirect("/");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  revalidatePath("/");
  redirect("/");
}
