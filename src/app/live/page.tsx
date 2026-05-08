import { Clock3, Headphones, Radio, ShieldCheck } from "lucide-react";
import { Card, SectionHeader } from "@/components/card";
import { Badge } from "@/components/badge";
import { ClassBadge } from "@/components/class-badge";
import { nextRace, races } from "@/lib/league-data";
import { leagueConfig } from "@/lib/league-config";
import { daysUntil, formatRaceDate, safeExternalUrl } from "@/lib/utils";

export default function LivePage() {
  const twitchParent = new URL(leagueConfig.siteUrl).hostname;
  const twitchEmbedUrl = `https://player.twitch.tv/?channel=${encodeURIComponent(leagueConfig.twitchChannel)}&parent=${encodeURIComponent(twitchParent)}`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionHeader
        eyebrow="Broadcast"
        title="Live Stream"
        body="Official stream access, race-week schedule, replay links and commentary desk information."
      />
      <Card className="mb-6 border-red-400/20 bg-[linear-gradient(110deg,rgba(220,38,38,0.18),rgba(8,47,73,0.16),rgba(9,9,11,0.9))]">
        <div className="grid gap-5 md:grid-cols-[1.2fr_auto] md:items-center">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge>Broadcast Banner</Badge>
              <ClassBadge value={nextRace.carClass} />
            </div>
            <h2 className="text-3xl font-black uppercase text-white">{nextRace.name}</h2>
            <p className="mt-2 text-sm text-zinc-300">{nextRace.trackName} | {nextRace.format}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded bg-black/40 p-4">
              <p className="text-3xl font-black text-cyan-200">{daysUntil(nextRace.raceDate)}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Days</p>
            </div>
            <div className="rounded bg-black/40 p-4">
              <p className="text-3xl font-black text-white">{nextRace.status}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Status</p>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="bg-black">
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
            <Radio size={18} /> Twitch
          </div>
          <div className="aspect-video rounded border border-white/10 bg-zinc-950">
            <iframe
              className="size-full rounded"
              src={twitchEmbedUrl}
              title={`${leagueConfig.shortName} Twitch stream`}
              allowFullScreen
            />
          </div>
        </Card>
        <div className="grid gap-6">
          <Card>
            <h3 className="mb-3 text-xl font-black uppercase text-white">Kick Broadcast Slot</h3>
            <div className="grid min-h-40 place-items-center rounded border border-dashed border-white/15 bg-white/5 text-center text-sm text-zinc-500">
              A secondary broadcast channel will be listed here when scheduled for race week.
            </div>
          </Card>
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-xl font-black uppercase text-white"><Headphones size={20} className="text-cyan-300" /> Commentary Team</h3>
            <div className="grid gap-3 text-sm">
              {["Lead commentator", "Co-commentator", "Race-control liaison"].map((role) => (
                <div key={role} className="rounded border border-white/10 bg-white/5 p-3">
                  <p className="font-semibold text-white">{role}</p>
                  <p className="text-zinc-500">Crew assignments are published before the event briefing.</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-xl font-black uppercase text-white"><ShieldCheck size={20} className="text-cyan-300" /> Race Control</h3>
            <div className="grid gap-3 text-sm text-zinc-400">
              <p className="flex items-center gap-2"><Clock3 size={16} className="text-zinc-500" /> Incident reporting window opens after race finish.</p>
              <p>Steward highlights and broadcast notes are published with the event record when race control completes review.</p>
            </div>
          </Card>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-xl font-black uppercase text-white">Upcoming Broadcasts</h3>
          <div className="grid gap-3">
            {races.filter((race) => race.status !== "completed").map((race) => (
              <p key={race.id} className="flex justify-between gap-4 rounded bg-white/5 p-3 text-sm">
                <span className="font-semibold text-white">{race.name}</span>
                <span className="text-zinc-400">{formatRaceDate(race.raceDate)}</span>
              </p>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 text-xl font-black uppercase text-white">Latest Replays</h3>
          <div className="grid gap-3">
            {races.filter((race) => race.replayUrl).map((race) => (
              <a key={race.id} href={safeExternalUrl(race.replayUrl)} className="rounded bg-white/5 p-3 text-sm font-semibold text-cyan-100">
                {race.name}
              </a>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
