import { Clock3, Flag, Radio, Scale, ShieldCheck } from "lucide-react";
import { ActionLink } from "@/components/action-link";
import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";
import { ClassBadge } from "@/components/class-badge";
import { nextRace } from "@/lib/league-data";
import { getHomepageActivity, type PublicNextRace } from "@/lib/public-activity";
import { formatRaceDate } from "@/lib/utils";

function fallbackNextRace(): PublicNextRace {
  return {
    id: nextRace.id,
    name: nextRace.name,
    trackName: nextRace.trackName,
    raceDate: nextRace.raceDate,
    format: nextRace.format,
    category: nextRace.category,
    setup: nextRace.setup,
    carClass: nextRace.carClass,
    registrationStatus: nextRace.registrationStatus,
  };
}

function countdownParts(value: string) {
  const diff = Math.max(0, new Date(value).getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
  };
}

async function getSafeHomepageActivity() {
  try {
    return await getHomepageActivity();
  } catch (error) {
    console.error("Race control activity failed to load", error);
    return null;
  }
}

export default async function RaceControlPage() {
  const activity = await getSafeHomepageActivity();
  const race = activity?.nextRace ?? fallbackNextRace();
  const countdown = countdownParts(race.raceDate);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <div className="mb-8 overflow-hidden rounded-lg border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(8,47,73,0.24),rgba(9,9,11,0.96))] p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <SectionHeader
            eyebrow="Race Control"
            title="Operations Desk"
            body="Next event timing, public steward bulletins and live broadcast access for the race week."
          />
          <div className="flex flex-wrap gap-2">
            <Badge>{race.registrationStatus}</Badge>
            <ClassBadge value={race.carClass} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-red-400/20 bg-black/55">
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-red-200">
            <Flag size={18} /> Next Race
          </div>
          <h1 className="text-3xl font-black uppercase text-white sm:text-4xl">{race.name}</h1>
          <p className="mt-2 text-zinc-400">{race.trackName}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-4xl font-black text-cyan-200">{countdown.days}</p>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Days</p>
            </div>
            <div className="rounded border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-4xl font-black text-white">{countdown.hours}</p>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Hours</p>
            </div>
            <div className="rounded border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-xl font-black uppercase text-white">{race.setup}</p>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Setup</p>
            </div>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-zinc-400">
            <Clock3 size={16} /> {formatRaceDate(race.raceDate)} | {race.format}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ActionLink href={`/races/${race.id}`} variant="secondary">Race Sheet</ActionLink>
            <ActionLink href="/steward-reports" variant="ghost">Submit Report</ActionLink>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="bg-cyan-400/5">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              <Scale size={18} /> Steward Bulletin
            </div>
            <p className="text-sm leading-6 text-zinc-400">
              Finalized public decisions appear after Race Control completes review. Pending reports and evidence stay private.
            </p>
            <ActionLink href="/stewards/decisions" className="mt-4 w-full">View Decisions</ActionLink>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              <Radio size={18} /> Broadcast
            </div>
            <p className="text-sm leading-6 text-zinc-400">
              Stream, replay and race-week broadcast notes are collected on the live desk.
            </p>
            <ActionLink href="/live" className="mt-4 w-full">Open Live Desk</ActionLink>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              <ShieldCheck size={18} /> Operations Rhythm
            </div>
            <div className="grid gap-2 text-sm text-zinc-400">
              {["Briefing published", "Race session", "Incident window", "Decision bulletin"].map((item) => (
                <p key={item} className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">{item}</p>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
