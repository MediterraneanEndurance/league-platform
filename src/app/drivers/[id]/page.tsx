import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, Gauge, Medal, Scale, ShieldCheck, Trophy } from "lucide-react";
import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";
import { ClassBadge } from "@/components/class-badge";
import { getPublicDriverProfile } from "@/lib/public-activity";
import { countryFlag, formatRaceDate } from "@/lib/utils";

type StatCard = [label: string, value: number, Icon: typeof Trophy];

export default async function DriverProfilePage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const driver = await getPublicDriverProfile(id);
  if (!driver) notFound();

  const statCards: StatCard[] = [
    ["Wins", driver.wins, Trophy],
    ["Podiums", driver.podiums, Medal],
    ["Fastest Laps", driver.fastestLaps, Gauge],
    ["Race Entries", driver.raceEntries, Flag],
    ["Penalties", driver.penaltiesReceived, Scale],
    ["Penalty Pts", driver.penaltyPoints, ShieldCheck],
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 overflow-hidden rounded-lg border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(9,9,11,0.98),rgba(12,20,28,0.94))] p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge>{driver.approvalStatus}</Badge>
              <ClassBadge value={driver.preferredClass} />
              <Badge>{driver.teamName ?? "Independent"}</Badge>
            </div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-red-300">
              {driver.carNumber ? `#${driver.carNumber}` : "Driver Entry"} | {countryFlag(driver.country)} {driver.country}
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase leading-none text-white md:text-6xl">{driver.displayName}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
              Public race profile for championship operations, classifications and finalized race-control decisions.
            </p>
          </div>
          <Card className="bg-black/35 lg:min-w-80">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Entry</p>
            <p className="mt-2 text-xl font-black uppercase text-white">{driver.preferredCar ?? "Car TBC"}</p>
            <div className="mt-4 grid gap-2 text-sm text-zinc-400">
              <p className="flex justify-between gap-4"><span>Team</span><span className="text-white">{driver.teamName ?? "Independent"}</span></p>
              <p className="flex justify-between gap-4"><span>Region</span><span className="text-white">{driver.region ?? "Europe"}</span></p>
              <p className="flex justify-between gap-4"><span>Rating</span><span className="text-white">{driver.rating ?? "Unrated"}</span></p>
              <p className="flex justify-between gap-4"><span>Safety</span><span className="text-white">{driver.safetyRating ?? "Pending"}</span></p>
            </div>
          </Card>
        </div>
      </div>

      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {statCards.map(([label, value, Icon]) => (
          <Card key={String(label)} className="bg-black/50">
            <Icon className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-white">{value}</p>
          </Card>
        ))}
      </div>

      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <SectionHeader eyebrow="Race History" title="Recent Classifications" />
          <div className="grid gap-3">
            {driver.recentResults.map((result) => (
              <Card key={result.id} className="bg-zinc-950/65">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">{formatRaceDate(result.raceDate)}</p>
                    <h2 className="mt-2 text-xl font-black uppercase text-white">{result.raceName}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{result.trackName}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-zinc-300 sm:min-w-64">
                    <p className="flex justify-between gap-4"><span>Classification</span><span className="font-black text-white">P{result.position}</span></p>
                    <p className="flex justify-between gap-4"><span>Points</span><span className="font-black text-cyan-200">{result.points}</span></p>
                    <p className="flex justify-between gap-4"><span>Best Lap</span><span>{result.bestLap ?? "Not recorded"}{result.fastestLap ? " FL" : ""}</span></p>
                  </div>
                  <Link href={`/races/${result.raceId}`} className="rounded border border-white/10 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.16em] text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10">
                    Race Sheet
                  </Link>
                </div>
              </Card>
            ))}
            {driver.recentResults.length === 0 ? (
              <Card className="bg-black/40">
                <p className="text-sm leading-6 text-zinc-400">No completed race classifications are published for this driver yet.</p>
              </Card>
            ) : null}
          </div>
        </div>

        <div>
          <SectionHeader eyebrow="Race Control" title="Public Decisions" />
          <div className="grid gap-3">
            {driver.publicDecisions.map((decision) => (
              <Card key={decision.id} className="bg-black/45">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge tone="border-cyan-400/40 bg-cyan-400/10 text-cyan-100">Final</Badge>
                  <Badge>{decision.status}</Badge>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{decision.raceName}</p>
                <h3 className="mt-2 font-black uppercase text-white">{decision.incidentType ?? "Steward Review"}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{decision.decision}</p>
                {decision.penalty ? <p className="mt-2 text-sm text-cyan-100">{decision.penalty}</p> : null}
              </Card>
            ))}
            {driver.publicDecisions.length === 0 ? (
              <Card className="bg-black/40">
                <p className="text-sm leading-6 text-zinc-400">No finalized public steward decisions are attached to this driver.</p>
              </Card>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}
