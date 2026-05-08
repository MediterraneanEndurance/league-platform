import Papa from "papaparse";
import { leagueConfig } from "@/lib/league-config";
import type { ImportPreviewRow, ImportValidationSummary, UploadedResultRow } from "@/types/league";

export const defaultPoints: Record<number, number> = leagueConfig.pointsSystem.finishing;

export const requiredResultColumns = [
  "driver_name",
  "car_number",
  "team_name",
  "position",
  "qualifying_position",
  "best_lap",
  "total_time",
  "gap",
  "laps_completed",
  "penalties_seconds",
  "dnf",
  "dns",
  "dsq",
  "fastest_lap",
] as const;

export type ImportDriverReference = {
  id: string;
  display_name: string;
  car_number: number;
  steam_id?: string | null;
  team_id?: string | null;
};

export type ImportTeamReference = {
  id: string;
  name: string;
};

export type ResultImportReferences = {
  drivers: ImportDriverReference[];
  teams: ImportTeamReference[];
};

export type ResultPointsConfig = {
  finishing: Record<number, number>;
  fastestLapBonus: number;
  allowDnfPoints: boolean;
};

const lapTimePattern = /^(?:\d{1,2}:)?\d{1,2}:\d{2}\.\d{3}$/;
const allowedBooleanValues = new Set(["", "true", "false", "1", "0", "yes", "no", "y", "n"]);

export const pointsConfig: ResultPointsConfig = {
  finishing: leagueConfig.pointsSystem.finishing,
  fastestLapBonus: leagueConfig.pointsSystem.fastestLapBonus,
  allowDnfPoints: leagueConfig.pointsSystem.allowDnfPoints,
};

const toBool = (value: string | boolean | undefined) =>
  value === true || ["true", "1", "yes", "y"].includes(String(value ?? "").trim().toLowerCase());

const toNumber = (value: string | number | undefined) => {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeHeader = (header: string) => header.trim().toLowerCase();

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeRow(row: Partial<Record<string, unknown>>): UploadedResultRow {
  return {
    driver_name: normalizeText(row.driver_name),
    car_number: normalizeText(row.car_number),
    team_name: normalizeText(row.team_name),
    position: normalizeText(row.position),
    qualifying_position: normalizeText(row.qualifying_position),
    best_lap: normalizeText(row.best_lap),
    total_time: normalizeText(row.total_time),
    gap: normalizeText(row.gap),
    laps_completed: normalizeText(row.laps_completed),
    penalties_seconds: normalizeText(row.penalties_seconds),
    dnf: normalizeText(row.dnf),
    dns: normalizeText(row.dns),
    dsq: normalizeText(row.dsq),
    fastest_lap: normalizeText(row.fastest_lap),
  };
}

export function parseCsvResults(csv: string) {
  return Papa.parse<UploadedResultRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });
}

export function parseJsonResults(json: string) {
  const parsed = JSON.parse(json) as unknown;
  if (!Array.isArray(parsed)) throw new Error("JSON result import must be an array of row objects.");
  return parsed.map((row) => normalizeRow((row ?? {}) as Partial<Record<string, unknown>>));
}

export function parseResultContent(content: string, format: "csv" | "json") {
  if (format === "json") {
    return { rows: parseJsonResults(content), fields: [...requiredResultColumns], parseErrors: [] as string[] };
  }
  const parsed = parseCsvResults(content);
  return {
    rows: parsed.data,
    fields: (parsed.meta.fields ?? []).map(normalizeHeader),
    parseErrors: parsed.errors.map((error) => `Row ${error.row ?? "unknown"}: ${error.message}`),
  };
}

function matchDriver(row: UploadedResultRow, references: ResultImportReferences) {
  const carNumber = row.car_number ? toNumber(row.car_number) : null;
  const driverName = normalizeText(row.driver_name).toLowerCase();
  const steamId = normalizeText((row as UploadedResultRow & { steam_id?: string }).steam_id);

  if (carNumber !== null) {
    const byCarNumber = references.drivers.find((driver) => driver.car_number === carNumber);
    if (byCarNumber) return byCarNumber;
  }

  if (driverName) {
    const byDisplayName = references.drivers.find((driver) => driver.display_name.toLowerCase() === driverName);
    if (byDisplayName) return byDisplayName;
  }

  if (steamId) {
    return references.drivers.find((driver) => driver.steam_id === steamId);
  }

  return undefined;
}

function matchTeam(teamName: string, references: ResultImportReferences) {
  if (!teamName) return undefined;
  return references.teams.find((team) => team.name.toLowerCase() === teamName.toLowerCase());
}

export function calculateImportPoints({
  position,
  fastestLap,
  dnf,
  dns,
  dsq,
  config = pointsConfig,
}: {
  position: number;
  fastestLap: boolean;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  config?: ResultPointsConfig;
}) {
  if (dns || dsq) return 0;
  if (dnf && !config.allowDnfPoints) return 0;
  return (config.finishing[position] ?? 0) + (fastestLap ? config.fastestLapBonus : 0);
}

export function validateResultContent(
  content: string,
  format: "csv" | "json",
  references: ResultImportReferences,
  config: ResultPointsConfig = pointsConfig,
): ImportValidationSummary {
  let parsed: ReturnType<typeof parseResultContent>;
  try {
    parsed = parseResultContent(content, format);
  } catch (error) {
    return {
      rows: [],
      missingColumns: [],
      parseErrors: [error instanceof Error ? error.message : "Could not parse result file."],
      hasBlockingErrors: true,
      hasWarnings: false,
    };
  }

  const fields = new Set(parsed.fields);
  const missingColumns = requiredResultColumns.filter((column) => !fields.has(column));

  if (missingColumns.length > 0) {
    return {
      rows: [],
      missingColumns,
      parseErrors: parsed.parseErrors,
      hasBlockingErrors: true,
      hasWarnings: false,
    };
  }

  const seenDrivers = new Map<string, number>();
  const rows: ImportPreviewRow[] = parsed.rows.map((row, index) => {
    const rowNumber = index + 2;
    const carNumber = row.car_number ? toNumber(row.car_number) : null;
    const driverName = normalizeText(row.driver_name);
    const teamName = normalizeText(row.team_name);
    const matchedDriver = matchDriver(row, references);
    const matchedTeam = matchTeam(teamName, references);
    const position = toNumber(row.position);
    const qualifyingPosition = toNumber(row.qualifying_position);
    const lapsCompleted = toNumber(row.laps_completed);
    const penaltiesSeconds = toNumber(row.penalties_seconds);
    const penaltyPoints = toNumber((row as UploadedResultRow & { penalty_points?: string }).penalty_points);
    const fastestLap = toBool(row.fastest_lap);
    const dnf = toBool(row.dnf);
    const dns = toBool(row.dns);
    const dsq = toBool(row.dsq);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!driverName) errors.push("Missing driver name");
    if (!carNumber) errors.push("Missing or invalid car number");
    if (!matchedDriver) errors.push("Unmatched driver");
    if (!teamName) warnings.push("Team is blank");
    if (teamName && !matchedTeam) warnings.push("Unmatched team; importing as independent");
    if (!position || position < 1) errors.push("Missing or invalid position");
    if (!lapsCompleted && !dns) warnings.push("Laps completed is empty or zero");
    if (penaltiesSeconds < 0) errors.push("Penalty seconds cannot be negative");
    if (penaltyPoints < 0) errors.push("Penalty points cannot be negative");
    if (!row.gap) warnings.push("Gap is missing");
    if (!row.total_time) warnings.push("Total time is missing");

    if (row.best_lap && !lapTimePattern.test(row.best_lap.trim())) {
      warnings.push("Best lap format should look like 1:42.381");
    }

    for (const field of ["dnf", "dns", "dsq", "fastest_lap"] as const) {
      const value = String(row[field] ?? "").trim().toLowerCase();
      if (!allowedBooleanValues.has(value)) warnings.push(`${field} should be true/false`);
    }

    const driverKey = matchedDriver?.id ?? `${driverName.toLowerCase()}|${carNumber ?? ""}`;
    const duplicateFirstSeen = seenDrivers.get(driverKey);
    if (duplicateFirstSeen) {
      errors.push(`Duplicate driver entry also appears on row ${duplicateFirstSeen}`);
    } else {
      seenDrivers.set(driverKey, rowNumber);
    }

    const points = calculateImportPoints({ position, fastestLap, dnf, dns, dsq, config });

    return {
      rowNumber,
      driverName,
      carNumber,
      teamName,
      matchedDriverId: matchedDriver?.id,
      matchedDriverName: matchedDriver?.display_name,
      matchedTeamId: matchedTeam?.id,
      matchedTeamName: matchedTeam?.name,
      position,
      qualifyingPosition,
      points,
      bestLap: normalizeText(row.best_lap),
      totalTime: normalizeText(row.total_time),
      gap: normalizeText(row.gap),
      lapsCompleted,
      penaltiesSeconds,
      penaltyPoints,
      errors,
      warnings,
      fastestLap,
      dnf,
      dns,
      dsq,
    };
  });

  return {
    rows,
    missingColumns,
    parseErrors: parsed.parseErrors,
    hasBlockingErrors: parsed.parseErrors.length > 0 || rows.some((row) => row.errors.length > 0),
    hasWarnings: rows.some((row) => row.warnings.length > 0),
  };
}

export function validateResultCsv(csv: string): ImportValidationSummary {
  return validateResultContent(csv, "csv", { drivers: [], teams: [] });
}
