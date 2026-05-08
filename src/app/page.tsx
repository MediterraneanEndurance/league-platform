import Image from "next/image";
import { CalendarDays, Clock3, Flag, Radio, Scale, ShieldCheck, Trophy, Users } from "lucide-react";
import { ActionLink, ExternalAction } from "@/components/action-link";
import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";
import { ClassBadge } from "@/components/class-badge";
import { LatestResults, StandingsTable } from "@/components/league-tables";
import { SessionStrip } from "@/components/session-strip";
import { driverStandings, newsPosts, nextRace } from "@/lib/league-data";
import { leagueConfig } from "@/lib/league-config";
import { getHomepageActivity, getPublicActivityStats, type PublicNextRace } from "@/lib/public-activity";
import { formatRaceDate } from "@/lib/utils";

const featureCards: Array<[string, string, typeof Users]> = [
  ["Drivers", "European endurance grid", Users],
  ["Stewarding", "Clear incident review", ShieldCheck],
  ["Broadcast", "Race-week coverage", Radio],
  ["Results", "Verified classifications", Trophy],
];

function countdownParts(value: string) {
  const diff = Math.max(0, new Date(value).getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return { days, hours };
}

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

export default async function Home() {
  const [activity, homepageActivity] = await Promise.all([getPublicActivityStats(), getHomepageActivity()]);
  const publicNextRace = homepageActivity?.nextRace ?? fallbackNextRace();
  const countdown = countdownParts(publicNextRace.raceDate);
  const leaders = driverStandings.slice(0, 3);
  const raceLength = publicNextRace.category === "Sprint Race" ? "Sprint" : "Endurance";
  const statItems: Array<[string, number]> = activity
    ? [
        ["Registered Drivers", activity.registeredDrivers],
        ["Approved Drivers", activity.approvedDrivers],
        ["Active Teams", activity.activeTeams],
        ["Race Weekends", activity.raceWeekends],
        ["Steward Decisions", activity.stewardDecisions],
        ...(activity.communityVisits === null ? [] : [["Community Visits", activity.communityVisits] as [string, number]]),
      ]
    : [];

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <Image
          src="/hero-endurance.jpg"
          alt="Endurance racing atmosphere"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(5,6,8,0.98)_0%,rgba(5,6,8,0.75)_48%,rgba(5,6,8,0.96)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#050608] to-transparent" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-8 px-4 py-10 sm:py-16 lg:min-h-[760px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-4xl">
            <Badge tone="border-red-400/50 bg-red-600/15 text-red-100">Le Mans Ultimate League</Badge>
            <h1 className="mt-5 text-4xl font-black uppercase leading-[0.98] text-white sm:text-5xl md:text-7xl">
              {leagueConfig.leagueName}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 md:text-lg">
              Competitive endurance racing across Europe, built around clean multi-class racing,
              transparent stewarding and race-week operations that feel ready before lights out.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-row">
              <ExternalAction href={leagueConfig.discordUrl} variant="secondary" className="w-full sm:w-auto">Join Discord</ExternalAction>
              <ActionLink href="/register" variant="primary" className="w-full sm:w-auto">Register Driver</ActionLink>
            </div>
            <div className="mt-10 max-w-2xl">
              <SessionStrip />
            </div>
          </div>
          <Card className="border-cyan-400/30 bg-black/75 backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
                <CalendarDays size={18} /> Race Countdown
              </div>
              <Badge>{publicNextRace.registrationStatus}</Badge>
            </div>
            <h2 className="text-3xl font-black uppercase text-white">{publicNextRace.name}</h2>
            <p className="mt-2 text-zinc-400">{publicNextRace.trackName}</p>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded bg-white/5 p-4 text-center">
                <span className="block text-2xl font-black text-cyan-200 sm:text-3xl">{countdown.days}</span>
                <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">Days</span>
              </div>
              <div className="rounded bg-white/5 p-4 text-center">
                <span className="block text-2xl font-black text-white sm:text-3xl">{countdown.hours}</span>
                <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">Hours</span>
              </div>
              <div className="rounded bg-white/5 p-4 text-center">
                <span className="block text-lg font-black text-white sm:text-3xl">{raceLength}</span>
                <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">Format</span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <ClassBadge value={publicNextRace.carClass} />
              <Badge>{publicNextRace.setup}</Badge>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-zinc-400"><Clock3 size={16} /> {formatRaceDate(publicNextRace.raceDate)} | {publicNextRace.format}</p>
            <ActionLink href="/race-control" className="mt-6 w-full">View Race Control</ActionLink>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-4">
          {featureCards.map(([title, body, Icon]) => (
            <Card key={String(title)} className="bg-zinc-950/60 hover:border-cyan-400/30 hover:bg-zinc-900/70">
              <Icon className="mb-4 text-cyan-300" size={24} />
              <h3 className="font-black uppercase text-white">{title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          eyebrow="Community Activity"
          title="League Pulse"
          body="Public activity pulled from the live league ledger. No private reports, personal account data or estimated online figures are shown."
        />
        {activity ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {statItems.map(([label, value]) => (
              <Card key={label} className="bg-black/55">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                <p className="mt-3 text-3xl font-black text-white">{value}</p>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-cyan-400/20 bg-cyan-400/5">
            <p className="text-sm leading-6 text-zinc-300">
              Public league activity will appear here when the season ledger is connected.
            </p>
          </Card>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <SectionHeader eyebrow="Race Results" title="Latest Results" body="Published imports from race control appear here with winner, podium and fastest lap context." />
          <LatestResults />
        </div>
        <div>
          <SectionHeader eyebrow="Championship" title="Current Leaders" />
          <StandingsTable standings={leaders} mode="drivers" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          eyebrow="Championship Operations"
          title="Public Activity"
          body="Recent entries, classifications and race-control actions from the public league record."
        />
        {homepageActivity?.items.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {homepageActivity.items.map((item) => (
              <Card key={item.id} className="bg-black/45">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{item.label}</p>
                    <h3 className="mt-2 text-lg font-black uppercase text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{item.meta}</p>
                  </div>
                  <ActionLink href={item.href} className="py-2">View</ActionLink>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-white/10 bg-black/40">
            <p className="text-sm leading-6 text-zinc-400">Public activity will appear after driver approvals, classified results or official decisions are published.</p>
          </Card>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-cyan-400/20 bg-cyan-400/5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
            <Flag size={18} /> Active Championship
          </div>
          <h2 className="text-2xl font-black uppercase text-white">Season 1 race control is open</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            The championship calendar, entry list, classifications and sporting decisions are kept in one public rhythm:
            register, race, report, review and publish.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Entry review", "Briefing notes", "Published results"].map((item) => (
              <div key={item} className="rounded border border-white/10 bg-black/35 p-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
            <Scale size={18} /> Official Decisions
          </div>
          {homepageActivity?.decisions.length ? (
            <div className="grid gap-3">
              {homepageActivity.decisions.map((decision) => (
                <div key={decision.id} className="rounded border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{decision.raceName}</p>
                      <h3 className="mt-1 font-black uppercase text-white">
                        {decision.carNumber ? `#${decision.carNumber} ` : ""}{decision.driverName}
                      </h3>
                    </div>
                    <Badge>{decision.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{decision.decision}</p>
                  {decision.penalty ? <p className="mt-2 text-sm text-cyan-100">{decision.penalty}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-zinc-500">No public steward decisions have been published for completed races yet.</p>
          )}
          <ActionLink href="/stewards/decisions" className="mt-5 w-full">Steward Bulletin</ActionLink>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[1fr_0.9fr]">
        <Card className="min-h-80 bg-black">
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
            <Radio size={18} /> Live Broadcast
          </div>
          <div className="grid min-h-56 place-items-center rounded border border-white/10 bg-[linear-gradient(135deg,rgba(220,38,38,0.16),rgba(34,211,238,0.08),rgba(9,9,11,0.95))] text-center">
            <div>
              <p className="text-xl font-black uppercase text-white">Race Week Broadcast</p>
              <p className="mt-2 text-sm text-zinc-400">Stream links, replay access and race-control notes are published on the live page.</p>
            </div>
          </div>
        </Card>
        <div>
          <SectionHeader eyebrow="Paddock" title="Announcements" />
          <div className="grid gap-4">
            {newsPosts.map((post) => (
              <Card key={post.id}>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{formatRaceDate(post.createdAt)}</p>
                <h3 className="mt-2 text-lg font-black uppercase text-white">{post.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{post.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <Card className="border-red-400/20 bg-red-600/10">
          <SectionHeader
            eyebrow="Paddock"
            title="Join The Grid"
            body="Driver applications, steward reports, race results and broadcast links all move through the same race-control standard."
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <ActionLink href="/register" variant="primary">Apply To Race</ActionLink>
            <ExternalAction href={leagueConfig.discordUrl} variant="secondary">Join Discord</ExternalAction>
          </div>
        </Card>
      </section>
    </>
  );
}
