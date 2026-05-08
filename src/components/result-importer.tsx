"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, FileText, RotateCcw, Upload } from "lucide-react";
import { confirmResultImport } from "@/app/admin/result-import-actions";
import { emptyResultImportState } from "@/app/admin/result-import-action-types";
import type { ImportDriverOption, ImportRaceOption, ImportTeamOption } from "@/components/admin-import-panel";
import { requiredResultColumns, validateResultContent } from "@/lib/result-import";
import { cn, formatRaceDate } from "@/lib/utils";

export function ResultImporter({
  races,
  drivers,
  teams,
}: {
  races: ImportRaceOption[];
  drivers: ImportDriverOption[];
  teams: ImportTeamOption[];
}) {
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [sourceFilename, setSourceFilename] = useState("manual-import.csv");
  const [raceId, setRaceId] = useState("");
  const [replaceMode, setReplaceMode] = useState(false);
  const [fileError, setFileError] = useState("");
  const [state, action, pending] = useActionState(confirmResultImport, emptyResultImportState);

  const references = useMemo(() => ({ drivers, teams }), [drivers, teams]);
  const validation = useMemo(
    () => (content.trim() ? validateResultContent(content, format, references) : null),
    [content, format, references],
  );
  const rows = validation?.rows ?? [];
  const selectedRace = races.find((race) => race.id === raceId);
  const selectedRaceHasResults = Boolean(selectedRace?.result_count);
  const canPublish = Boolean(raceId && rows.length) && !validation?.hasBlockingErrors && (!selectedRaceHasResults || replaceMode);
  const totalPoints = rows.reduce((sum, row) => sum + row.points, 0);
  const warnings = rows.reduce((sum, row) => sum + row.warnings.length, 0);

  async function readFile(file: File | undefined) {
    setFileError("");
    if (!file) return;
    const isCsv = file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
    const isJson = file.type === "application/json" || file.name.toLowerCase().endsWith(".json");

    if (!isCsv && !isJson) {
      setFileError("Only CSV or JSON result files are allowed.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setFileError("File is too large. Keep manual imports below 1 MB.");
      return;
    }

    setFormat(isJson ? "json" : "csv");
    setSourceFilename(file.name);
    setContent(await file.text());
  }

  function cancelImport() {
    setContent("");
    setFileError("");
    setSourceFilename("manual-import.csv");
    setReplaceMode(false);
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="race_id" value={raceId} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="format" value={format} />
      <input type="hidden" name="source_filename" value={sourceFilename} />

      <label className="grid gap-2 text-sm font-semibold text-white">
        Race
        <select
          className="rounded border border-white/10 bg-black p-3 text-sm text-white"
          value={raceId}
          onChange={(event) => {
            setRaceId(event.target.value);
            setReplaceMode(false);
          }}
          required
        >
          <option value="">Select race</option>
          {races.map((race) => (
            <option key={race.id} value={race.id}>
              {race.name} - {race.track_name} - {formatRaceDate(race.race_date)}{race.result_count ? ` - ${race.result_count} existing results` : ""}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-zinc-500">Results are saved against this race and standings are recalculated for its championship.</span>
      </label>

      {selectedRaceHasResults ? (
        <label className="flex items-start gap-3 rounded border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-50">
          <input name="replace_mode" type="checkbox" checked={replaceMode} onChange={(event) => setReplaceMode(event.target.checked)} className="mt-1 size-4 accent-amber-300" />
          <span>
            <strong className="block text-white">Replace existing results</strong>
            This race already has {selectedRace?.result_count} result rows. Replacement deletes old rows for this race, imports the new rows, then recalculates standings from all championship results.
          </span>
        </label>
      ) : (
        <input type="hidden" name="replace_mode" value={replaceMode ? "on" : "off"} />
      )}

      <div className="rounded border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-white">
          <FileText size={18} className="text-cyan-300" /> Result File
        </div>
        <input
          className="block w-full rounded border border-white/10 bg-black p-3 text-sm text-zinc-300 file:mr-4 file:rounded file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.14em] file:text-black"
          type="file"
          accept=".csv,.json,text/csv,application/json"
          onChange={(event) => void readFile(event.target.files?.[0])}
        />
        <p className="mt-3 text-xs leading-5 text-zinc-500">Required columns: {requiredResultColumns.join(", ")}.</p>
        {fileError ? <p className="mt-3 rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{fileError}</p> : null}
      </div>

      {rows.length ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded border border-white/10 bg-black/50 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Rows</p>
            <p className="mt-1 text-2xl font-black text-white">{rows.length}</p>
          </div>
          <div className="rounded border border-white/10 bg-black/50 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Points</p>
            <p className="mt-1 text-2xl font-black text-cyan-200">{totalPoints}</p>
          </div>
          <div className="rounded border border-white/10 bg-black/50 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Errors</p>
            <p className="mt-1 text-2xl font-black text-red-200">{rows.reduce((sum, row) => sum + row.errors.length, 0)}</p>
          </div>
          <div className="rounded border border-white/10 bg-black/50 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Warnings</p>
            <p className="mt-1 text-2xl font-black text-amber-200">{warnings}</p>
          </div>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-semibold text-zinc-300">
        Or paste CSV/JSON result export
        <textarea
          className="min-h-48 rounded border border-white/10 bg-black p-3 font-mono text-xs text-white"
          placeholder="driver_name,car_number,team_name,position,qualifying_position,best_lap,total_time,gap,laps_completed,penalties_seconds,dnf,dns,dsq,fastest_lap"
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setSourceFilename(`manual-import.${format}`);
          }}
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-black/50 p-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          {validation?.hasBlockingErrors || (selectedRaceHasResults && !replaceMode) ? (
            <Ban size={18} className="text-red-300" />
          ) : validation?.hasWarnings ? (
            <AlertTriangle size={18} className="text-amber-300" />
          ) : rows.length ? (
            <CheckCircle2 size={18} className="text-cyan-300" />
          ) : (
            <Upload size={18} className="text-zinc-500" />
          )}
          {selectedRaceHasResults && !replaceMode
            ? "Existing results found. Enable replace mode to confirm."
            : rows.length
              ? `${rows.length} rows parsed. ${
                  validation?.hasBlockingErrors
                    ? "Resolve blocking errors before publishing."
                    : validation?.hasWarnings
                      ? "Warnings found. Review before publishing."
                      : "Ready for protected import."
                }`
              : "Preview appears after a race and valid file are selected."}
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 rounded border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={!content}
            onClick={cancelImport}
          >
            <RotateCcw size={16} /> Cancel
          </button>
          <button
            className="inline-flex items-center gap-2 rounded bg-red-600 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-40"
            type="submit"
            disabled={!canPublish || pending}
          >
            <Upload size={16} /> {pending ? "Importing..." : "Confirm Import"}
          </button>
        </div>
      </div>

      {state.message ? (
        <div className={`rounded border p-4 text-sm ${state.ok ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-50" : "border-red-400/30 bg-red-500/10 text-red-100"}`}>
          <p className="font-semibold">{state.message}</p>
          {state.summary ? (
            <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em]">
              <span>{state.summary.importedRows} rows</span>
              <span>{state.summary.warnings} warnings</span>
              <span>{state.summary.replaceMode ? "replace mode" : "new import"}</span>
              <Link href="/standings" className="text-cyan-100">View standings</Link>
              {raceId ? <Link href={`/races/${raceId}`} className="text-cyan-100">View race</Link> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {validation?.missingColumns.length ? (
        <div className="rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          Missing required columns: {validation.missingColumns.join(", ")}
        </div>
      ) : null}

      {validation?.parseErrors.length ? (
        <div className="rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {validation.parseErrors.join(" ")}
        </div>
      ) : null}

      {rows.length ? (
        <div className="overflow-hidden rounded border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-zinc-400">
                <tr>
                  <th className="px-3 py-3">Row</th>
                  <th className="px-3 py-3">Pos</th>
                  <th className="px-3 py-3">Driver</th>
                  <th className="px-3 py-3">Team</th>
                  <th className="px-3 py-3">Q</th>
                  <th className="px-3 py-3">Points</th>
                  <th className="px-3 py-3">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rows.map((row) => (
                  <tr key={`${row.driverName}-${row.rowNumber}`} className={cn(row.errors.length && "bg-red-500/5")}>
                    <td className="px-3 py-3 text-zinc-500">{row.rowNumber}</td>
                    <td className="px-3 py-3 font-bold text-white">P{row.position || "-"}</td>
                    <td className="px-3 py-3 text-white">
                      #{row.carNumber ?? "-"} {row.driverName || "Unknown"}
                      <span className="block text-xs text-zinc-500">{row.matchedDriverName ? `Matched: ${row.matchedDriverName}` : "No driver match"}</span>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">
                      {row.teamName || "Independent"}
                      <span className="block text-xs text-zinc-500">{row.matchedTeamName ? `Matched: ${row.matchedTeamName}` : "No team match"}</span>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">{row.qualifyingPosition || "-"}</td>
                    <td className="px-3 py-3 font-black text-cyan-200">{row.points}</td>
                    <td className="px-3 py-3 text-xs">
                      {row.errors.length ? <span className="text-red-200">{row.errors.join(", ")}</span> : null}
                      {row.warnings.length ? <span className="block text-amber-200">{row.warnings.join(", ")}</span> : null}
                      {!row.errors.length && !row.warnings.length ? <span className="text-zinc-400">Matched</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </form>
  );
}
