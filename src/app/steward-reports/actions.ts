"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { StewardReportActionState } from "./steward-report-action-types";

function asString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function validHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function submitStewardReport(
  _previousState: StewardReportActionState,
  formData: FormData,
): Promise<StewardReportActionState> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Incident reporting is not open yet." };
  }

  const authClient = await createSupabaseServerClient();
  const serviceClient = createSupabaseServiceClient();
  if (!authClient || !serviceClient) {
    return { ok: false, message: "Incident reporting is temporarily unavailable." };
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return { ok: false, message: "Login is required before submitting an incident report." };

  const { data: reportingDriver } = await serviceClient
    .from("drivers")
    .select("id, approval_status")
    .eq("user_id", user.id)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (!reportingDriver) {
    return { ok: false, message: "Only approved drivers can submit steward reports." };
  }

  const raceId = asString(formData, "race_id");
  const reportedDriverId = asString(formData, "reported_driver_id");
  const lapNumber = Number(asString(formData, "lap_number"));
  const description = asString(formData, "incident_description");
  const evidenceUrl = asString(formData, "evidence_url");
  const incidentType = asString(formData, "incident_type");
  const cornerName = asString(formData, "corner_name");
  const timestampInVideo = asString(formData, "timestamp_in_video");

  const fieldErrors: Record<string, string> = {};
  if (!raceId) fieldErrors.race_id = "Select the race.";
  if (!reportedDriverId) fieldErrors.reported_driver_id = "Select the reported driver.";
  if (reportedDriverId && reportedDriverId === reportingDriver.id) fieldErrors.reported_driver_id = "Drivers cannot report themselves.";
  if (!Number.isInteger(lapNumber) || lapNumber < 1) fieldErrors.lap_number = "Lap number must be a positive number.";
  if (description.length < 20) fieldErrors.incident_description = "Describe the incident in at least 20 characters.";
  if (!validHttpUrl(evidenceUrl)) fieldErrors.evidence_url = "Provide a valid HTTP or HTTPS evidence link.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Check the highlighted fields before submitting.", fieldErrors };
  }

  const [{ data: race }, { data: reportedDriver }] = await Promise.all([
    serviceClient.from("races").select("id").eq("id", raceId).maybeSingle(),
    serviceClient.from("drivers").select("id, approval_status").eq("id", reportedDriverId).eq("approval_status", "approved").maybeSingle(),
  ]);

  if (!race) return { ok: false, message: "Selected race was not found." };
  if (!reportedDriver) return { ok: false, message: "Selected reported driver is not an approved driver." };

  const { error } = await serviceClient.from("steward_reports").insert({
    race_id: raceId,
    reporting_driver_id: reportingDriver.id,
    reported_driver_id: reportedDriverId,
    lap_number: lapNumber,
    description,
    evidence_url: evidenceUrl,
    incident_type: incidentType || null,
    corner_name: cornerName || null,
    timestamp_in_video: timestampInVideo || null,
    status: "pending",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/steward-reports");
  revalidatePath("/steward");
  return { ok: true, message: "Report submitted. Race control will review it before publishing any decision." };
}
