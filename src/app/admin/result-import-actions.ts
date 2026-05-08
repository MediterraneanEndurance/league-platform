"use server";

import { revalidatePath } from "next/cache";
import { canAccessAdmin, getAuthState } from "@/lib/auth";
import { pointsConfig, validateResultContent, type ResultImportReferences } from "@/lib/result-import";
import { createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { ResultImportActionState } from "./result-import-action-types";

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireAdminServiceClient() {
  const auth = await getAuthState();
  if (!isSupabaseConfigured()) return { error: "Race-control systems are not connected.", supabase: null };
  if (!canAccessAdmin(auth.role)) return { error: "Admin role required.", supabase: null };
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { error: "Result imports are temporarily unavailable.", supabase: null };
  return { error: null, supabase };
}

export async function confirmResultImport(
  _previousState: ResultImportActionState,
  formData: FormData,
): Promise<ResultImportActionState> {
  const { error, supabase } = await requireAdminServiceClient();
  if (error || !supabase) return { ok: false, message: error ?? "Import is unavailable." };

  const raceId = stringValue(formData, "race_id");
  const sourceFilename = stringValue(formData, "source_filename") || "manual-import.csv";
  const content = stringValue(formData, "content");
  const format = stringValue(formData, "format") === "json" ? "json" : "csv";
  const replaceMode = stringValue(formData, "replace_mode") === "on";

  if (!raceId) return { ok: false, message: "Select a race before confirming import." };
  if (!content) return { ok: false, message: "Upload or paste a result file before confirming import." };

  const [{ data: race }, { count: existingCount }, { data: drivers }, { data: teams }] = await Promise.all([
    supabase.from("races").select("id, championship_id").eq("id", raceId).maybeSingle(),
    supabase.from("race_results").select("id", { count: "exact", head: true }).eq("race_id", raceId),
    supabase.from("drivers").select("id, display_name, car_number, steam_id, team_id").eq("approval_status", "approved"),
    supabase.from("teams").select("id, name"),
  ]);

  if (!race?.championship_id) {
    return { ok: false, message: "Selected race does not exist or is not linked to a championship." };
  }

  if ((existingCount ?? 0) > 0 && !replaceMode) {
    return { ok: false, message: "This race already has results. Enable replace mode to overwrite and recalculate standings." };
  }

  const references: ResultImportReferences = {
    drivers: drivers ?? [],
    teams: teams ?? [],
  };
  const validation = validateResultContent(content, format, references, pointsConfig);
  if (validation.rows.length === 0) {
    return { ok: false, message: "No result rows were found in the import file." };
  }

  if (validation.hasBlockingErrors) {
    const rowErrors = validation.rows.flatMap((row) => row.errors.map((rowError) => `Row ${row.rowNumber}: ${rowError}`));
    return {
      ok: false,
      message: [...validation.missingColumns.map((column) => `Missing column: ${column}`), ...validation.parseErrors, ...rowErrors].join(" "),
    };
  }

  const payload = validation.rows.map((row) => ({
    driver_id: row.matchedDriverId,
    team_id: row.matchedTeamId ?? null,
    position: row.position,
    qualifying_position: row.qualifyingPosition || null,
    points: row.points,
    best_lap: row.bestLap || null,
    total_time: row.totalTime || null,
    gap: row.gap || null,
    laps_completed: row.lapsCompleted,
    penalties_seconds: row.penaltiesSeconds,
    penalty_points: row.penaltyPoints,
    dnf: row.dnf,
    dns: row.dns,
    dsq: row.dsq,
    fastest_lap: row.fastestLap,
  }));

  const { data, error: rpcError } = await supabase.rpc("import_race_results", {
    p_race_id: raceId,
    p_replace: replaceMode,
    p_source_filename: sourceFilename,
    p_rows: payload,
  });

  if (rpcError) return { ok: false, message: rpcError.message };

  const result = (data ?? {}) as {
    batch_id?: string;
    imported_rows?: number;
    championship_id?: string;
    replace_mode?: boolean;
  };
  const warnings = validation.rows.reduce((sum, row) => sum + row.warnings.length, 0);

  revalidatePath("/admin");
  revalidatePath("/standings");
  revalidatePath("/results");
  revalidatePath(`/races/${raceId}`);

  return {
    ok: true,
    message: `Imported ${result.imported_rows ?? payload.length} rows and recalculated championship standings.`,
    summary: {
      batchId: result.batch_id,
      importedRows: result.imported_rows ?? payload.length,
      championshipId: result.championship_id,
      replaceMode: Boolean(result.replace_mode),
      warnings,
    },
  };
}
