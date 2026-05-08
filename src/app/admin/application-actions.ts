"use server";

import { revalidatePath } from "next/cache";
import { canAccessAdmin, getAuthState } from "@/lib/auth";
import { sendApplicationStatusEmail } from "@/lib/notifications";
import { createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { AdminApplicationActionState } from "./application-action-types";

async function requireAdminClient() {
  if (!isSupabaseConfigured()) {
    return { error: "Race-control systems are not connected.", supabase: null };
  }

  const auth = await getAuthState();
  if (!canAccessAdmin(auth.role)) {
    return { error: "Admin role required.", supabase: null };
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return { error: "Admin actions are temporarily unavailable.", supabase: null };

  return { error: "", supabase };
}

async function getApplicationContact(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdminClient>>["supabase"]>,
  applicationId: string,
) {
  const { data: application } = await supabase
    .from("driver_applications")
    .select("id, user_id, display_name")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application?.user_id) return null;

  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", application.user_id)
    .maybeSingle();

  return user?.email
    ? {
        email: user.email,
        displayName: application.display_name,
      }
    : null;
}

export async function approveDriverApplication(
  _previousState: AdminApplicationActionState,
  formData: FormData,
): Promise<AdminApplicationActionState> {
  const applicationId = String(formData.get("application_id") ?? "");
  const { error, supabase } = await requireAdminClient();

  if (error || !supabase) return { ok: false, message: error };
  if (!applicationId) return { ok: false, message: "Missing application id." };

  const contact = await getApplicationContact(supabase, applicationId);

  const { error: approvalError } = await supabase.rpc("approve_driver_application", {
    p_application_id: applicationId,
  });

  if (approvalError) return { ok: false, message: approvalError.message };

  if (contact) {
    await sendApplicationStatusEmail({
      ...contact,
      status: "approved",
    }).catch(() => undefined);
  }

  revalidatePath("/admin");
  revalidatePath("/drivers");

  return { ok: true, message: "Application approved and driver profile created." };
}

export async function rejectDriverApplication(
  _previousState: AdminApplicationActionState,
  formData: FormData,
): Promise<AdminApplicationActionState> {
  const applicationId = String(formData.get("application_id") ?? "");
  const rejectionNote = String(formData.get("rejection_note") ?? "").trim();
  const { error, supabase } = await requireAdminClient();

  if (error || !supabase) return { ok: false, message: error };
  if (!applicationId) return { ok: false, message: "Missing application id." };
  if (rejectionNote.length < 3) return { ok: false, message: "Add a short rejection note." };

  const contact = await getApplicationContact(supabase, applicationId);

  const { error: statusError } = await supabase
    .from("driver_applications")
    .update({
      status: "rejected",
      rejection_note: rejectionNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("status", "pending");

  if (statusError) return { ok: false, message: statusError.message };

  if (contact) {
    await sendApplicationStatusEmail({
      ...contact,
      status: "rejected",
      reason: rejectionNote,
    }).catch(() => undefined);
  }

  revalidatePath("/admin");
  revalidatePath("/register");

  return { ok: true, message: "Application rejected and kept for audit history." };
}
