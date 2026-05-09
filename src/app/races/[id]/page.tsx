import { notFound } from "next/navigation";
import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";
import { RaceResultsTable } from "@/components/league-tables";
import { drivers, getRace, getTeam } from "@/lib/league-data";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { formatRaceDate, safeExternalUrl } from "@/lib/utils";

type PenaltyRow = {
  id: string;
  driver_id: string;
  reason: string;
  seconds: number;
  penalty_points: number;
  steward_note?: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getPublishedPenalties(raceId: string) {
  if (!isSupabaseConfigured() || !isUuid(raceId)) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("penalties")
    .select("id, driver_id, reason, seconds, penalty_points, steward_note")
    .eq("race_id", raceId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PenaltyRow[];
}

export default async function RaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const race = getRace(id);
  if (!race) notFound();
  const penalties = await getPublishedPenalties(race.id);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionHeader eyebrow="Race Control" title={race.name} body={race.trackName} />
        <div className="flex gap-2"><Badge>{race.status}</Badge><Badge>{race.registrationStatus}</Badge></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="grid gap-6">
          <Card>
            <h3 className="mb-4 text-xl font-black uppercase text-white">Race Information</h3>
            <div className="grid gap-3 text-sm">
              <p className="flex justify-between gap-4"><span className="text-zinc-500">Date</span><span>{formatRaceDate(race.raceDate)}</span></p>
              <p className="flex justify-between gap-4"><span className="text-zinc-500">Class</span><span>{race.carClass}</span></p>
              <p className="flex justify-between gap-4"><span className="text-zinc-500">Format</span><span>{race.format}</span></p>
              <p className="flex justify-between gap-4"><span className="text-zinc-500">Category</span><span>{race.category}</span></p>
              <p className="flex justify-between gap-4"><span className="text-zinc-500">Setup</span><span>{race.setup}</span></p>
              <p className="flex justify-between gap-4"><span className="text-zinc-500">Stream</span><a href={safeExternalUrl(race.streamUrl)} className="text-cyan-200">Open stream</a></p>
              <p className="flex justify-between gap-4"><span className="text-zinc-500">Replay</span><a href={safeExternalUrl(race.replayUrl ?? race.streamUrl)} className="text-cyan-200">Open replay</a></p>
            </div>
          </Card>
          <Card>
            <h3 className="mb-4 text-xl font-black uppercase text-white">Entry List</h3>
            <div className="grid gap-2">
              {drivers.filter((driver) => driver.approvalStatus === "approved").map((driver) => (
                <div key={driver.id} className="flex justify-between rounded bg-white/5 p-3 text-sm">
                  <span className="font-semibold text-white">#{driver.carNumber} {driver.displayName}</span>
                  <span className="text-zinc-400">{getTeam(driver.teamId)?.name ?? "N/A"}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card>
            <h3 className="mb-4 text-xl font-black uppercase text-white">Qualifying and Race Results</h3>
            <RaceResultsTable raceId={race.id} />
          </Card>
          <Card>
            <h3 className="mb-4 text-xl font-black uppercase text-white">Penalties and Steward Notes</h3>
            <div className="grid gap-3">
              {penalties.map((penalty) => (
                <div key={penalty.id} className="rounded border border-white/10 bg-white/5 p-4 text-sm">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-bold text-white">{penalty.reason}</span>
                    <Badge>{penalty.seconds}s</Badge>
                  </div>
                  <p className="text-zinc-400">{penalty.penalty_points} penalty points</p>
                  <p className="mt-2 text-cyan-100">{penalty.steward_note ?? "Steward note pending"}</p>
                </div>
              ))}
              {penalties.length === 0 ? <p className="text-sm text-zinc-500">No published penalties for this race.</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
