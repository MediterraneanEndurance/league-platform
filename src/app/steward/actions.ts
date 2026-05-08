"use server";

import { revalidatePath } from "next/cache";
import { canAccessAdmin, canAccessSteward, getAuthState } from "@/lib/auth";
import { createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { StewardActionState } from "./steward-action-types";

const reportStatuses = ["pending", "under_review", "accepted", "rejected"] as const;

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireStewardClient(adminOnly = false) {
  const auth = await getAuthState();
  if (!isSupabaseConfigured()) return { error: "Race-control systems are not connected.", supabase: null, auth };
  if (adminOnly ? !canAccessAdmin(auth.role) : !canAccessSteward(auth.role)) {
    return { error: adminOnly ? "Admin role required." : "Steward or admin role required.", supabase: null, auth };
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return { error: "Steward actions are temporarily unavailable.", supabase: null, auth };
  return { error: null, supabase, auth };
}

export async function updateStewardReport(
  _previousState: StewardActionState,
  formData: FormData,
): Promise<StewardActionState> {
  const { error, supabase } = await requireStewardClient();
  if (error || !supabase) return { ok: false, message: error ?? "Steward action unavailable." };

  const reportId = value(formData, "report_id");
  const status = value(formData, "status");
  const stewardDecision = value(formData, "steward_decision");
  const penaltyRecommendation = value(formData, "penalty_recommendation");
  const resolved = value(formData, "resolved") === "on";

  if (!reportId) return { ok: false, message: "Report id is missing." };
  if (!reportStatuses.includes(status as (typeof reportStatuses)[number])) return { ok: false, message: "Invalid report status." };
  if ((status === "accepted" || status === "rejected") && stewardDecision.length < 10) {
    return { ok: false, message: "Accepted or rejected reports require a clear steward decision." };
  }

  const { error: updateError } = await supabase
    .from("steward_reports")
    .update({
      status,
      steward_decision: stewardDecision || null,
      penalty_recommendation: penaltyRecommendation || null,
      resolved_at: resolved ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (updateError) return { ok: false, message: updateError.message };

  revalidatePath("/steward");
  revalidatePath("/steward-reports");
  return { ok: true, message: "Report decision updated." };
}

export async function addPenaltyForReport(
  _previousState: StewardActionState,
  formData: FormData,
): Promise<StewardActionState> {
  const { error, supabase } = await requireStewardClient();
  if (error || !supabase) return { ok: false, message: error ?? "Penalty action unavailable." };

  const reportId = value(formData, "report_id");
  const raceId = value(formData, "race_id");
  const driverId = value(formData, "driver_id");
  const reason = value(formData, "reason");
  const seconds = Number(value(formData, "seconds") || "0");
  const penaltyPoints = Number(value(formData, "penalty_points") || "0");
  const stewardNote = value(formData, "steward_note");

  if (!reportId || !raceId || !driverId) return { ok: false, message: "Report, race and driver are required." };
  if (reason.length < 5) return { ok: false, message: "Penalty reason must be specific." };
  if (!Number.isInteger(seconds) || seconds < 0) return { ok: false, message: "Penalty seconds must be a non-negative whole number." };
  if (!Number.isInteger(penaltyPoints) || penaltyPoints < 0) return { ok: false, message: "Penalty points must be a non-negative whole number." };

  // Verify the driver actually participated in this race before issuing a penalty.
  // This prevents stewards from creating phantom penalties for non-participants.
  const { data: raceEntry, error: raceEntryError } = await supabase
    .from("race_results")
    .select("id")
    .eq("race_id", raceId)
    .eq("driver_id", driverId)
    .maybeSingle();

  if (raceEntryError) return { ok: false, message: `Race results lookup failed: ${raceEntryError.message}` };
  if (!raceEntry) {
    return {
      ok: false,
      message: "This driver has no race result for the selected race. Import results first, or verify the driver and race are correct.",
    };
  }

  const { error: insertError } = await supabase.from("penalties").insert({
    report_id: reportId,
    race_id: raceId,
    driver_id: driverId,
    reason,
    seconds,
    penalty_points: penaltyPoints,
    steward_note: stewardNote || null,
  });

  if (insertError) return { ok: false, message: insertError.message };

  revalidatePath("/steward");
  revalidatePath("/admin");
  return { ok: true, message: "Penalty saved. Standings are not updated in this phase." };
}

export async function voidStewardReport(
  _previousState: StewardActionState,
  formData: FormData,
): Promise<StewardActionState> {
  const { error, supabase } = await requireStewardClient(true);
  if (error || !supabase) return { ok: false, message: error ?? "Admin action unavailable." };

  const reportId = value(formData, "report_id");
  const voidReason = value(formData, "void_reason");
  if (!reportId) return { ok: false, message: "Report id is missing." };
  if (voidReason.length < 8) return { ok: false, message: "Void reason is required." };

  const { error: updateError } = await supabase
    .from("steward_reports")
    .update({
      status: "rejected",
      voided: true,
      void_reason: voidReason,
      steward_decision: `Voided: ${voidReason}`,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (updateError) return { ok: false, message: updateError.message };
  revalidatePath("/steward");
  return { ok: true, message: "Report voided and retained for audit history." };
}
