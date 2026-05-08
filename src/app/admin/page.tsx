import { Bell, Lock, Plus, Radio, Scale, Upload } from "lucide-react";
import { AdminApplicationReview } from "@/components/admin-application-review";
import { AdminImportPanel, type ImportDriverOption, type ImportRaceOption, type ImportTeamOption } from "@/components/admin-import-panel";
import { Card, SectionHeader } from "@/components/card";
import { canAccessAdmin, getAuthState } from "@/lib/auth";
import { allowLocalAuthFallback, createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const adminActions: Array<[string, typeof Plus]> = [
  ["Create season", Plus],
  ["Create championship", Plus],
  ["Create race", Plus],
  ["Add/edit drivers", Plus],
  ["Add/edit teams", Plus],
  ["Manual points edit", Scale],
  ["Add penalties", Scale],
  ["Publish announcements", Plus],
  ["Add stream links", Radio],
  ["Mark race status", Plus],
];

async function getPendingApplications(enabled: boolean) {
  if (!enabled) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return data ?? [];
}

async function getRaceControlSummary(enabled: boolean) {
  if (!enabled) return { reportCount: 0, pendingReports: [], penalties: [] };
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { reportCount: 0, pendingReports: [], penalties: [] };

  const [{ count }, { data: pendingReports }, { data: penalties }] = await Promise.all([
    supabase.from("steward_reports").select("id", { count: "exact", head: true }),
    supabase.from("steward_reports").select("id, lap_number, status, description").eq("status", "pending").order("created_at", { ascending: true }).limit(5),
    supabase.from("penalties").select("id, reason, seconds, penalty_points").order("created_at", { ascending: false }).limit(5),
  ]);

  return { reportCount: count ?? 0, pendingReports: pendingReports ?? [], penalties: penalties ?? [] };
}

async function getImportReferences(enabled: boolean) {
  if (!enabled) return { races: [], drivers: [], teams: [] };
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { races: [], drivers: [], teams: [] };

  const [{ data: races }, { data: drivers }, { data: teams }, { data: resultCounts }] = await Promise.all([
    supabase.from("races").select("id, name, track_name, race_date, status, championship_id").order("race_date", { ascending: false }),
    supabase.from("drivers").select("id, display_name, car_number, steam_id, team_id").eq("approval_status", "approved").order("car_number", { ascending: true }),
    supabase.from("teams").select("id, name").order("name", { ascending: true }),
    supabase.from("race_results").select("race_id"),
  ]);

  const counts = new Map<string, number>();
  (resultCounts ?? []).forEach((row) => counts.set(row.race_id, (counts.get(row.race_id) ?? 0) + 1));

  return {
    races: ((races ?? []) as ImportRaceOption[]).map((race) => ({ ...race, result_count: counts.get(race.id) ?? 0 })),
    drivers: (drivers ?? []) as ImportDriverOption[],
    teams: (teams ?? []) as ImportTeamOption[],
  };
}

export default async function AdminPage() {
  const auth = await getAuthState();

  if (!auth.configured && !allowLocalAuthFallback()) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-red-400/30 bg-red-500/10">
          <div className="mb-4 inline-flex items-center gap-2 rounded border border-red-400/40 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-red-100">
            <Lock size={16} /> Setup required
          </div>
          <h1 className="text-3xl font-black uppercase text-white">Admin disabled</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Race-control systems must be connected before admin tools can open outside local development.
          </p>
        </Card>
      </section>
    );
  }

  if (auth.configured && !canAccessAdmin(auth.role)) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-red-400/30 bg-red-500/10">
          <div className="mb-4 inline-flex items-center gap-2 rounded border border-red-400/40 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-red-100">
            <Lock size={16} /> Access denied
          </div>
          <h1 className="text-3xl font-black uppercase text-white">Admin role required</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Sign in with an authorised league staff account to manage race operations.
          </p>
        </Card>
      </section>
    );
  }

  const adminEnabled = auth.configured && canAccessAdmin(auth.role);
  const [pendingApplications, raceControl, importReferences] = await Promise.all([
    getPendingApplications(adminEnabled),
    getRaceControlSummary(adminEnabled),
    getImportReferences(adminEnabled),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionHeader
          eyebrow="Protected"
          title="Admin Dashboard"
          body={
            auth.configured
              ? "Role checks are active. League operations remain restricted to authorised staff accounts."
              : "Race-control systems are not connected. Connect them before live league operations."
          }
        />
        <div className="inline-flex items-center gap-2 rounded border border-red-400/40 bg-red-600/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-red-100">
          <Lock size={16} /> {auth.configured ? `Role: ${auth.role}` : "Setup required"}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="border-cyan-400/20 bg-cyan-400/5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Race Control</p>
              <p className="mt-2 text-2xl font-black text-white">{raceControl.reportCount}</p>
              <p className="text-sm text-zinc-500">reports tracked</p>
            </Card>
            <Card>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Applications</p>
              <p className="mt-2 text-2xl font-black text-white">{pendingApplications.length}</p>
              <p className="text-sm text-zinc-500">pending review</p>
            </Card>
            <Card>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Import Mode</p>
              <p className="mt-2 text-2xl font-black text-white">Preview</p>
              <p className="text-sm text-zinc-500">review before publish</p>
            </Card>
            <Card>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Access</p>
              <p className="mt-2 text-2xl font-black text-white">{auth.configured ? "Active" : "Offline"}</p>
              <p className="text-sm text-zinc-500">staff role checked</p>
            </Card>
          </div>
          <Card>
            <h3 className="mb-4 text-xl font-black uppercase text-white">Operations</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
              {adminActions.map(([label, Icon]) => (
                <button
                  key={label}
                  className="flex cursor-not-allowed items-center justify-between rounded border border-white/10 bg-white/5 p-3 text-left text-sm text-zinc-300 opacity-75"
                  type="button"
                  disabled
                  title="Requires a completed race-control workflow before enabling."
                >
                  <span className="font-semibold text-white">{label}</span>
                  <span className="flex items-center gap-2 text-xs text-zinc-500"><Icon size={15} /> Protected</span>
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="mb-4 text-xl font-black uppercase text-white">Pending Driver Applications</h3>
            <AdminApplicationReview applications={pendingApplications} />
          </Card>
          <Card>
            <h3 className="mb-4 text-xl font-black uppercase text-white">Steward Queue</h3>
            <div className="grid gap-3">
              {raceControl.pendingReports.map((report) => (
                <div key={report.id} className="rounded bg-white/5 p-3 text-sm">
                  <p className="font-semibold text-white">Lap {report.lap_number} | {report.status}</p>
                  <p className="mt-1 text-zinc-500">{report.description}</p>
                </div>
              ))}
              {raceControl.pendingReports.length === 0 ? <p className="text-sm text-zinc-500">No pending private reports.</p> : null}
            </div>
          </Card>
          <Card>
            <h3 className="mb-4 text-xl font-black uppercase text-white">Recent Penalties</h3>
            <div className="grid gap-3">
              {raceControl.penalties.map((penalty) => (
                <div key={penalty.id} className="rounded bg-white/5 p-3 text-sm">
                  <p className="font-semibold text-white">{penalty.reason}</p>
                  <p className="mt-1 text-zinc-500">{penalty.seconds}s | {penalty.penalty_points} penalty points</p>
                </div>
              ))}
              {raceControl.penalties.length === 0 ? <p className="text-sm text-zinc-500">No penalties recorded yet.</p> : null}
            </div>
          </Card>
        </div>
        <Card>
          <div className="mb-4 flex items-center gap-2 text-xl font-black uppercase text-white">
            <Upload className="text-cyan-300" size={22} /> Race Result Import
          </div>
          <p className="mb-5 text-sm leading-6 text-zinc-400">
            Upload starts as manual CSV/JSON. The parser matches by display name or car number, matches team names, calculates default points,
            flags invalid rows and previews everything before confirmed publication.
          </p>
          <AdminImportPanel races={importReferences.races} drivers={importReferences.drivers} teams={importReferences.teams} />
        </Card>
      </div>
      <Card className="mt-6 border-amber-400/20 bg-amber-400/5">
        <div className="flex items-start gap-3">
          <Bell size={20} className="mt-1 text-amber-200" />
          <p className="text-sm leading-6 text-amber-50">
            Season launch rule: review every destructive operation before publication, keep result imports atomic, and recalculate standings
            only after every row passes validation.
          </p>
        </div>
      </Card>
    </section>
  );
}
