import Link from "next/link";
import { FileText, Filter, Scale } from "lucide-react";
import { ActionLink } from "@/components/action-link";
import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";
import { getPublicStewardDecisions } from "@/lib/public-activity";
import { formatRaceDate } from "@/lib/utils";

type DecisionsSearchParams = {
  race?: string;
  driver?: string;
};

function optionValue(value: string | undefined) {
  return value && value.trim().length > 0 ? value : "";
}

export default async function PublicStewardDecisionsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<DecisionsSearchParams>;
}>) {
  const params = await searchParams;
  const decisions = await getPublicStewardDecisions(80);
  const selectedRace = optionValue(params.race);
  const selectedDriver = optionValue(params.driver);
  const raceOptions = Array.from(new Set(decisions.map((decision) => decision.raceName))).sort();
  const driverOptions = Array.from(new Set(decisions.map((decision) => decision.driverName))).sort();
  const filtered = decisions.filter((decision) => {
    const raceMatches = selectedRace ? decision.raceName === selectedRace : true;
    const driverMatches = selectedDriver ? decision.driverName === selectedDriver : true;
    return raceMatches && driverMatches;
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 overflow-hidden rounded-lg border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(8,12,18,0.96),rgba(6,6,8,0.98))] p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="Race Control"
            title="Steward Bulletin"
            body="Final public decisions from completed race weekends. Pending reports, private evidence, reporter details and internal notes are never published here."
          />
          <div className="grid gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500 sm:grid-cols-3 lg:min-w-[34rem]">
            <span className="rounded border border-white/10 bg-black/35 p-3">Official Decisions</span>
            <span className="rounded border border-white/10 bg-black/35 p-3">Completed Races</span>
            <span className="rounded border border-white/10 bg-black/35 p-3">Public Summary Only</span>
          </div>
        </div>
      </div>

      <Card className="mb-6 bg-black/45">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]" method="get">
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
            Race
            <select
              className="rounded border border-white/10 bg-zinc-950 px-3 py-3 text-sm font-semibold normal-case tracking-normal text-white"
              name="race"
              defaultValue={selectedRace}
            >
              <option value="">All races</option>
              {raceOptions.map((race) => (
                <option key={race} value={race}>{race}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
            Driver
            <select
              className="rounded border border-white/10 bg-zinc-950 px-3 py-3 text-sm font-semibold normal-case tracking-normal text-white"
              name="driver"
              defaultValue={selectedDriver}
            >
              <option value="">All drivers</option>
              {driverOptions.map((driver) => (
                <option key={driver} value={driver}>{driver}</option>
              ))}
            </select>
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded bg-cyan-300 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:bg-cyan-200" type="submit">
            <Filter size={16} /> Filter
          </button>
          <Link className="inline-flex items-center justify-center rounded border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10" href="/stewards/decisions">
            Reset
          </Link>
        </form>
      </Card>

      <div className="grid gap-4">
        {filtered.map((decision, index) => (
          <Card key={decision.id} className="border-white/10 bg-zinc-950/80">
            <div className="grid gap-5 lg:grid-cols-[auto_1fr_auto]">
              <div className="grid size-16 place-items-center rounded border border-cyan-400/20 bg-cyan-400/10 text-lg font-black text-cyan-100">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge tone="border-cyan-400/40 bg-cyan-400/10 text-cyan-100">Final</Badge>
                  <Badge>{decision.status}</Badge>
                  {decision.incidentType ? <Badge>{decision.incidentType}</Badge> : null}
                </div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
                  {decision.championshipName ?? "Championship Round"} | {decision.raceName}
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase text-white">
                  {decision.carNumber ? `#${decision.carNumber} ` : ""}{decision.driverName}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">{decision.trackName ?? "Race venue"}</p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded border border-white/10 bg-black/35 p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300"><Scale size={15} /> Decision</p>
                    <p className="text-sm leading-6 text-zinc-300">{decision.decision}</p>
                  </div>
                  <div className="rounded border border-white/10 bg-black/35 p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-red-300"><FileText size={15} /> Penalty</p>
                    <p className="text-sm leading-6 text-zinc-300">{decision.penalty ?? "No sporting penalty applied."}</p>
                  </div>
                </div>
              </div>
              <div className="min-w-48 rounded border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Filed</p>
                <p className="mt-1 text-white">{formatRaceDate(decision.createdAt)}</p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Resolved</p>
                <p className="mt-1 text-white">{decision.resolvedAt ? formatRaceDate(decision.resolvedAt) : "Finalized"}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-white/10 bg-black/40">
          <p className="text-sm leading-6 text-zinc-400">
            No finalized public steward decisions match this filter. Race control bulletins appear after a report is resolved and safe to publish.
          </p>
        </Card>
      ) : null}

      <div className="mt-8">
        <ActionLink href="/steward-reports">Submit Incident Report</ActionLink>
      </div>
    </section>
  );
}
