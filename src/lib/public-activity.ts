import { unstable_cache } from "next/cache";
import { nextRace as canonicalNextRace } from "@/lib/league-data";
import { createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";

export type PublicStewardDecision = {
  id: string;
  raceName: string;
  trackName: string | null;
  championshipName: string | null;
  driverName: string;
  carNumber: number | null;
  driverId: string | null;
  incidentType: string | null;
  decision: string;
  penalty: string | null;
  status: "accepted" | "rejected";
  createdAt: string;
  resolvedAt: string | null;
};

export type PublicActivityStats = {
  registeredDrivers: number;
  approvedDrivers: number;
  activeTeams: number;
  raceWeekends: number;
  stewardDecisions: number;
  communityVisits: number | null;
  recentDecisions: PublicStewardDecision[];
};

export type PublicActivityItem = {
  id: string;
  type: "driver" | "team" | "result" | "penalty" | "decision";
  label: string;
  title: string;
  meta: string;
  href: string;
  createdAt: string;
};

export type HomepageActivity = {
  items: PublicActivityItem[];
  decisions: PublicStewardDecision[];
  nextRace: PublicNextRace | null;
};

export type PublicNextRace = {
  id: string;
  name: string;
  trackName: string;
  raceDate: string;
  format: string;
  category: string;
  setup: string;
  carClass: string;
  registrationStatus: string;
};

export type PublicDriverListItem = {
  id: string;
  displayName: string;
  country: string;
  region: string | null;
  carNumber: number | null;
  teamName: string | null;
  preferredClass: string;
  preferredCar: string | null;
  rating: number | null;
  safetyRating: string | null;
  approvalStatus: string;
  createdAt: string;
};

export type PublicDriverProfile = PublicDriverListItem & {
  wins: number;
  podiums: number;
  fastestLaps: number;
  raceEntries: number;
  penaltiesReceived: number;
  penaltyPoints: number;
  recentResults: Array<{
    id: string;
    raceId: string;
    raceName: string;
    trackName: string;
    raceDate: string;
    position: number;
    points: number;
    bestLap: string | null;
    fastestLap: boolean;
    dnf: boolean;
    dns: boolean;
    dsq: boolean;
  }>;
  publicDecisions: PublicStewardDecision[];
};

type RaceSummary = {
  id: string;
  championship_id: string | null;
  name: string;
  track_name: string | null;
  race_date: string | null;
  status: string;
};
type ChampionshipSummary = { id: string; name: string };
type PenaltySummary = {
  id: string;
  race_id: string;
  driver_id: string;
  reason: string;
  seconds: number;
  penalty_points: number;
  report_id: string | null;
  created_at: string;
};
type DriverSummary = {
  id: string;
  display_name: string;
  country?: string;
  region?: string | null;
  car_number: number | null;
  team_id?: string | null;
  preferred_class?: string;
  preferred_car?: string | null;
  rating?: number | null;
  safety_rating?: string | null;
  approval_status?: string;
  created_at?: string;
};
type TeamSummary = { id: string; name: string; country: string; created_at: string };
type StewardReportSummary = {
  id: string;
  race_id: string;
  reported_driver_id: string;
  incident_type: string | null;
  status: "accepted" | "rejected";
  steward_decision: string | null;
  penalty_recommendation: string | null;
  resolved_at: string | null;
  created_at: string;
};
type ResultSummary = {
  id: string;
  race_id: string;
  driver_id: string;
  position: number;
  points: number;
  best_lap: string | null;
  fastest_lap: boolean;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  created_at: string;
};

function resultCount(result: { count: number | null; error: { message: string } | null }) {
  return result.error || result.count === null ? null : result.count;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function penaltyLabel(penalty: Pick<PenaltySummary, "seconds" | "penalty_points" | "reason"> | null, fallback: string | null) {
  if (penalty) {
    const parts = [
      penalty.seconds > 0 ? `${penalty.seconds}s` : null,
      penalty.penalty_points > 0 ? `${penalty.penalty_points} penalty pts` : null,
      penalty.reason,
    ].filter(Boolean);
    return parts.join(" | ");
  }
  return fallback;
}

async function fetchCompletedRaceMap(supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>) {
  const { data } = await supabase
    .from("races")
    .select("id, championship_id, name, track_name, race_date, status")
    .eq("status", "completed")
    .limit(200);
  const races = (data ?? []) as RaceSummary[];
  return new Map(races.map((race) => [race.id, race]));
}

async function fetchChampionshipMap(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  championshipIds: string[],
) {
  if (championshipIds.length === 0) return new Map<string, ChampionshipSummary>();
  const { data } = await supabase.from("championships").select("id, name").in("id", championshipIds);
  return new Map(((data ?? []) as ChampionshipSummary[]).map((championship) => [championship.id, championship]));
}

async function fetchDriverMap(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  driverIds: string[],
) {
  if (driverIds.length === 0) return new Map<string, DriverSummary>();
  const { data } = await supabase.from("public_drivers").select("id, display_name, car_number").in("id", driverIds);
  return new Map(((data ?? []) as DriverSummary[]).map((driver) => [driver.id, driver]));
}

async function fetchPublicStewardDecisions(limit = 12, driverId?: string): Promise<PublicStewardDecision[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabaseServiceClient();
  if (!supabase) return [];

  let query = supabase
    .from("steward_reports")
    .select("id, race_id, reported_driver_id, incident_type, status, steward_decision, penalty_recommendation, resolved_at, created_at")
    .in("status", ["accepted", "rejected"])
    .eq("voided", false)
    .not("resolved_at", "is", null)
    .not("steward_decision", "is", null)
    .order("resolved_at", { ascending: false })
    .limit(limit);

  if (driverId) {
    query = query.eq("reported_driver_id", driverId);
  }

  const { data: reports, error } = await query;
  if (error || !reports?.length) return [];

  const reportRows = reports as StewardReportSummary[];
  const raceIds = Array.from(new Set(reportRows.map((report) => report.race_id)));
  const driverIds = Array.from(new Set(reportRows.map((report) => report.reported_driver_id)));
  const reportIds = reportRows.map((report) => report.id);

  const [{ data: races }, driverById, { data: penalties }] = await Promise.all([
    supabase.from("races").select("id, championship_id, name, track_name, race_date, status").in("id", raceIds),
    fetchDriverMap(supabase, driverIds),
    supabase.from("penalties").select("id, report_id, reason, seconds, penalty_points, created_at, race_id, driver_id").in("report_id", reportIds),
  ]);

  const raceRows = (races ?? []) as RaceSummary[];
  const raceById = new Map(raceRows.map((race) => [race.id, race]));
  const championshipById = await fetchChampionshipMap(
    supabase,
    Array.from(new Set(raceRows.map((race) => race.championship_id).filter((id): id is string => Boolean(id)))),
  );
  const penaltyByReportId = new Map(
    ((penalties ?? []) as PenaltySummary[])
      .filter((penalty) => penalty.report_id)
      .map((penalty) => [penalty.report_id as string, penalty]),
  );

  return reportRows
    .filter((report) => raceById.get(report.race_id)?.status === "completed")
    .map((report) => {
      const race = raceById.get(report.race_id);
      const driver = driverById.get(report.reported_driver_id);
      const penalty = penaltyByReportId.get(report.id) ?? null;
      return {
        id: report.id,
        raceName: race?.name ?? "Completed race",
        trackName: race?.track_name ?? null,
        championshipName: race?.championship_id ? championshipById.get(race.championship_id)?.name ?? null : null,
        driverName: driver?.display_name ?? "Classified driver",
        carNumber: driver?.car_number ?? null,
        driverId: report.reported_driver_id,
        incidentType: report.incident_type,
        decision: report.steward_decision ?? "Decision published",
        penalty: penaltyLabel(penalty, report.penalty_recommendation),
        status: report.status,
        createdAt: report.created_at,
        resolvedAt: report.resolved_at,
      };
    });
}

async function fetchPublicActivityStats(): Promise<PublicActivityStats | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;

  const [
    publicDriversResult,
    activeTeamsResult,
    raceWeekendsResult,
    visitsResult,
    completedRacesResult,
  ] = await Promise.all([
    supabase.from("public_drivers").select("id", { count: "exact", head: true }),
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase.from("races").select("id", { count: "exact", head: true }),
    supabase.from("community_visits").select("id", { count: "exact", head: true }),
    supabase.from("races").select("id, name, status").eq("status", "completed"),
  ]);

  const publicDrivers = resultCount(publicDriversResult);
  const activeTeams = resultCount(activeTeamsResult);
  const raceWeekends = resultCount(raceWeekendsResult);
  const visits = resultCount(visitsResult);
  if (publicDrivers === null || activeTeams === null || raceWeekends === null) {
    return null;
  }
  const completedRaces = (completedRacesResult.data ?? []) as RaceSummary[];
  const completedRaceIds = completedRaces.map((race) => race.id);

  if (completedRaceIds.length === 0) {
    return {
      registeredDrivers: publicDrivers,
      approvedDrivers: publicDrivers,
      activeTeams,
      raceWeekends,
      stewardDecisions: 0,
      communityVisits: visits,
      recentDecisions: [],
    };
  }

  const finalizedReportsResult = await supabase
    .from("steward_reports")
    .select("id", { count: "exact", head: true })
    .in("race_id", completedRaceIds)
    .in("status", ["accepted", "rejected"])
    .eq("voided", false)
    .not("resolved_at", "is", null)
    .not("steward_decision", "is", null);

  return {
    registeredDrivers: publicDrivers,
    approvedDrivers: publicDrivers,
    activeTeams,
    raceWeekends,
    stewardDecisions: resultCount(finalizedReportsResult) ?? 0,
    communityVisits: visits,
    recentDecisions: await fetchPublicStewardDecisions(3),
  };
}

export const getPublicActivityStats = unstable_cache(
  fetchPublicActivityStats,
  ["public-activity-stats-v3"],
  {
    revalidate: 300,
    tags: ["public-activity-stats"],
  },
);

async function fetchHomepageActivity(): Promise<HomepageActivity | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;

  const completedRaceById = await fetchCompletedRaceMap(supabase);
  const completedRaceIds = Array.from(completedRaceById.keys());
  const [approvedDriversResult, teamsResult, resultsResult, penaltiesResult, decisions] = await Promise.all([
    supabase
      .from("public_drivers")
      .select("id, display_name, car_number, country, preferred_class, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("teams").select("id, name, country, created_at").order("created_at", { ascending: false }).limit(3),
    completedRaceIds.length
      ? supabase
          .from("race_results")
          .select("id, race_id, driver_id, position, points, best_lap, fastest_lap, dnf, dns, dsq, created_at")
          .in("race_id", completedRaceIds)
          .order("created_at", { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] }),
    completedRaceIds.length
      ? supabase
          .from("penalties")
          .select("id, race_id, driver_id, reason, seconds, penalty_points, report_id, created_at")
          .in("race_id", completedRaceIds)
          .order("created_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
    fetchPublicStewardDecisions(3),
  ]);

  const resultRows = (resultsResult.data ?? []) as ResultSummary[];
  const penaltyRows = (penaltiesResult.data ?? []) as PenaltySummary[];
  const driverIds = Array.from(
    new Set([
      ...resultRows.map((result) => result.driver_id),
      ...penaltyRows.map((penalty) => penalty.driver_id),
    ]),
  );
  const driverById = await fetchDriverMap(supabase, driverIds);
  const items: PublicActivityItem[] = [];

  for (const driver of (approvedDriversResult.data ?? []) as DriverSummary[]) {
    items.push({
      id: `driver-${driver.id}`,
      type: "driver",
      label: "Season Registration",
      title: `${driver.car_number ? `#${driver.car_number} ` : ""}${driver.display_name} approved`,
      meta: [driver.country, driver.preferred_class].filter(Boolean).join(" | "),
      href: `/drivers/${driver.id}`,
      createdAt: driver.created_at ?? new Date(0).toISOString(),
    });
  }

  for (const team of (teamsResult.data ?? []) as TeamSummary[]) {
    items.push({
      id: `team-${team.id}`,
      type: "team",
      label: "Team Entry",
      title: team.name,
      meta: team.country,
      href: "/teams",
      createdAt: team.created_at,
    });
  }

  for (const result of resultRows) {
    const race = completedRaceById.get(result.race_id);
    const driver = driverById.get(result.driver_id);
    items.push({
      id: `result-${result.id}`,
      type: "result",
      label: "Published Classification",
      title: `P${result.position} ${driver?.display_name ?? "Classified driver"}`,
      meta: `${race?.name ?? "Completed race"} | ${result.points} pts`,
      href: `/races/${result.race_id}`,
      createdAt: result.created_at,
    });
  }

  for (const penalty of penaltyRows) {
    const race = completedRaceById.get(penalty.race_id);
    const driver = driverById.get(penalty.driver_id);
    items.push({
      id: `penalty-${penalty.id}`,
      type: "penalty",
      label: "Race Control",
      title: `${driver?.display_name ?? "Classified driver"} penalty`,
      meta: `${race?.name ?? "Completed race"} | ${penaltyLabel(penalty, null)}`,
      href: "/stewards/decisions",
      createdAt: penalty.created_at,
    });
  }

  for (const decision of decisions) {
    items.push({
      id: `decision-${decision.id}`,
      type: "decision",
      label: "Official Decision",
      title: decision.driverName,
      meta: `${decision.raceName} | ${decision.status}`,
      href: "/stewards/decisions",
      createdAt: decision.resolvedAt ?? decision.createdAt,
    });
  }

  return {
    items: items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8),
    decisions,
    nextRace: {
      id: canonicalNextRace.id,
      name: canonicalNextRace.name,
      trackName: canonicalNextRace.trackName,
      raceDate: canonicalNextRace.raceDate,
      format: canonicalNextRace.format,
      category: canonicalNextRace.category,
      setup: canonicalNextRace.setup,
      carClass: canonicalNextRace.carClass,
      registrationStatus: canonicalNextRace.registrationStatus,
    },
  };
}

export const getHomepageActivity = unstable_cache(fetchHomepageActivity, ["homepage-activity-v2"], {
  revalidate: 300,
  tags: ["public-activity"],
});

export const getPublicStewardDecisions = unstable_cache(fetchPublicStewardDecisions, ["public-steward-decisions-v1"], {
  revalidate: 300,
  tags: ["public-steward-decisions"],
});

async function fetchPublicDrivers(): Promise<PublicDriverListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;

  const { data: drivers } = await supabase
    .from("public_drivers")
    .select("id, display_name, country, region, car_number, team_id, preferred_class, preferred_car, rating, safety_rating, approval_status, created_at")
    .order("car_number", { ascending: true })
    .limit(120);
  const rows = (drivers ?? []) as DriverSummary[];
  const teamIds = Array.from(new Set(rows.map((driver) => driver.team_id).filter((id): id is string => Boolean(id))));
  const { data: teams } = teamIds.length
    ? await supabase.from("teams").select("id, name, country, created_at").in("id", teamIds)
    : { data: [] };
  const teamById = new Map(((teams ?? []) as TeamSummary[]).map((team) => [team.id, team]));

  return rows.map((driver) => ({
    id: driver.id,
    displayName: driver.display_name,
    country: driver.country ?? "Europe",
    region: driver.region ?? null,
    carNumber: driver.car_number,
    teamName: driver.team_id ? teamById.get(driver.team_id)?.name ?? null : null,
    preferredClass: driver.preferred_class ?? "Multi-class",
    preferredCar: driver.preferred_car ?? null,
    rating: driver.rating ?? null,
    safetyRating: driver.safety_rating ?? null,
    approvalStatus: driver.approval_status ?? "approved",
    createdAt: driver.created_at ?? new Date(0).toISOString(),
  }));
}

export const getPublicDrivers = unstable_cache(fetchPublicDrivers, ["public-drivers-v1"], {
  revalidate: 300,
  tags: ["public-drivers"],
});

async function fetchPublicDriverProfile(driverId: string): Promise<PublicDriverProfile | null> {
  if (!isUuid(driverId) || !isSupabaseConfigured()) return null;

  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;

  const { data: driver } = await supabase
    .from("public_drivers")
    .select("id, display_name, country, region, car_number, team_id, preferred_class, preferred_car, rating, safety_rating, approval_status, created_at")
    .eq("id", driverId)
    .maybeSingle();

  if (!driver) return null;

  const driverRow = driver as DriverSummary;
  const [teamResult, completedRaceById, resultRowsResult, penaltiesResult, decisions] = await Promise.all([
    driverRow.team_id ? supabase.from("teams").select("id, name, country, created_at").eq("id", driverRow.team_id).maybeSingle() : Promise.resolve({ data: null }),
    fetchCompletedRaceMap(supabase),
    supabase
      .from("race_results")
      .select("id, race_id, driver_id, position, points, best_lap, fastest_lap, dnf, dns, dsq, created_at")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("penalties").select("id, race_id, driver_id, reason, seconds, penalty_points, report_id, created_at").eq("driver_id", driverId),
    fetchPublicStewardDecisions(8, driverId),
  ]);

  const completedRaceIds = new Set(completedRaceById.keys());
  const results = ((resultRowsResult.data ?? []) as ResultSummary[]).filter((result) => completedRaceIds.has(result.race_id));
  const penalties = ((penaltiesResult.data ?? []) as PenaltySummary[]).filter((penalty) => completedRaceIds.has(penalty.race_id));
  const team = teamResult.data as TeamSummary | null;

  return {
    id: driverRow.id,
    displayName: driverRow.display_name,
    country: driverRow.country ?? "Europe",
    region: driverRow.region ?? null,
    carNumber: driverRow.car_number,
    teamName: team?.name ?? null,
    preferredClass: driverRow.preferred_class ?? "Multi-class",
    preferredCar: driverRow.preferred_car ?? null,
    rating: driverRow.rating ?? null,
    safetyRating: driverRow.safety_rating ?? null,
    approvalStatus: driverRow.approval_status ?? "approved",
    createdAt: driverRow.created_at ?? new Date(0).toISOString(),
    wins: results.filter((result) => result.position === 1 && !result.dns && !result.dsq).length,
    podiums: results.filter((result) => result.position >= 1 && result.position <= 3 && !result.dns && !result.dsq).length,
    fastestLaps: results.filter((result) => result.fastest_lap).length,
    raceEntries: results.filter((result) => !result.dns).length,
    penaltiesReceived: penalties.length,
    penaltyPoints: penalties.reduce((total, penalty) => total + penalty.penalty_points, 0),
    recentResults: results.slice(0, 8).map((result) => {
      const race = completedRaceById.get(result.race_id);
      return {
        id: result.id,
        raceId: result.race_id,
        raceName: race?.name ?? "Completed race",
        trackName: race?.track_name ?? "Race venue",
        raceDate: race?.race_date ?? result.created_at,
        position: result.position,
        points: result.points,
        bestLap: result.best_lap,
        fastestLap: result.fastest_lap,
        dnf: result.dnf,
        dns: result.dns,
        dsq: result.dsq,
      };
    }),
    publicDecisions: decisions,
  };
}

export const getPublicDriverProfile = unstable_cache(fetchPublicDriverProfile, ["public-driver-profile-v1"], {
  revalidate: 300,
  tags: ["public-driver-profile"],
});
