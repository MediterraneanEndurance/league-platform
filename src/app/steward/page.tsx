import { Lock } from "lucide-react";
import { Card, SectionHeader } from "@/components/card";
import { StewardDashboard, type StewardReportDashboardRow } from "@/components/steward-dashboard";
import { canAccessAdmin, canAccessSteward, getAuthState } from "@/lib/auth";
import { createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { formatRaceDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type RaceRow = { id: string; name: string; track_name: string; race_date: string };
type DriverRow = { id: string; display_name: string; car_number: number };
type PenaltyRow = { id: string; report_id?: string | null; driver_id: string; race_id: string; reason: string; seconds: number; penalty_points: number; steward_note?: string | null };

export default async function StewardPage() {
  const auth = await getAuthState();

  if (!isSupabaseConfigured()) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-red-400/30 bg-red-500/10">
          <SectionHeader eyebrow="Protected" title="Race Control Disabled" body="Race-control systems must be connected before steward tools can open." />
        </Card>
      </section>
    );
  }

  if (!canAccessSteward(auth.role)) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-red-400/30 bg-red-500/10">
          <div className="mb-4 inline-flex items-center gap-2 rounded border border-red-400/40 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-red-100">
            <Lock size={16} /> Access denied
          </div>
          <SectionHeader eyebrow="Protected" title="Steward Role Required" body="This area is reserved for authorised stewards and league administrators." />
        </Card>
      </section>
    );
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-red-400/30 bg-red-500/10">
          <SectionHeader eyebrow="Protected" title="Race Control Unavailable" body="Steward review actions are temporarily unavailable." />
        </Card>
      </section>
    );
  }

  const [{ data: reports }, { data: races }, { data: drivers }, { data: penalties }] = await Promise.all([
    supabase
      .from("steward_reports")
      .select("id, race_id, reporting_driver_id, reported_driver_id, lap_number, description, evidence_url, incident_type, corner_name, timestamp_in_video, status, steward_decision, penalty_recommendation, resolved_at, voided, void_reason, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("races").select("id, name, track_name, race_date").order("race_date", { ascending: false }),
    supabase.from("drivers").select("id, display_name, car_number").eq("approval_status", "approved").order("car_number", { ascending: true }),
    supabase.from("penalties").select("id, report_id, driver_id, race_id, reason, seconds, penalty_points, steward_note").order("created_at", { ascending: false }),
  ]);

  const raceLookups = ((races ?? []) as RaceRow[]).map((race) => ({
    id: race.id,
    name: race.name,
    detail: `${race.track_name} | ${formatRaceDate(race.race_date)}`,
  }));
  const driverLookups = ((drivers ?? []) as DriverRow[]).map((driver) => ({
    id: driver.id,
    name: `#${driver.car_number} ${driver.display_name}`,
  }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionHeader
          eyebrow="Protected"
          title="Steward Dashboard"
          body="Review private incident reports, publish decisions and record penalties without touching championship standings."
        />
        <div className="rounded border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
          Role: {auth.role}
        </div>
      </div>
      <StewardDashboard
        reports={(reports ?? []) as StewardReportDashboardRow[]}
        races={raceLookups}
        drivers={driverLookups}
        penalties={(penalties ?? []) as PenaltyRow[]}
        isAdmin={canAccessAdmin(auth.role)}
      />
    </section>
  );
}
