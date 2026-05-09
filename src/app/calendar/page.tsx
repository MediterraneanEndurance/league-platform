import { ActionLink } from "@/components/action-link";
import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";
import { CountdownTimer } from "@/components/countdown-timer";
import { RaceCard } from "@/components/league-tables";
import { races } from "@/lib/league-data";



export default function CalendarPage() {
  const seriesRaces = races.filter((race) => race.status === "upcoming" || race.status === "live");
  const openingRound = seriesRaces.find((race) => race.id === "round-1-spa-francorchamps") ?? seriesRaces[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionHeader
        eyebrow="Season Calendar"
        title="June 2026 Sprint Series"
        body="Every round runs on Friday at 21:00 TRT / 20:00 CEST on European LMU servers with fixed setup and tactical pitstops."
      />
      <Card className="mb-6 border-cyan-400/20 bg-cyan-400/5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="border-red-400/50 bg-red-600/15 text-red-100">Fixed Setup</Badge>
              <Badge tone="border-cyan-300/50 bg-cyan-300/10 text-cyan-100">3x Tire Wear</Badge>
              <Badge tone="border-cyan-300/50 bg-cyan-300/10 text-cyan-100">3x Fuel Usage</Badge>
            </div>
            <h3 className="text-xl font-black uppercase text-white">Registration is open for Spa-Francorchamps</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Round 1 starts June 12 at 21:00 TRT / 20:00 CEST. Qualifying is public, so traffic management is part of the challenge.
            </p>
          </div>
          <div className="grid gap-3 lg:min-w-96">
            {openingRound ? (
              <CountdownTimer
                targetDate={openingRound.raceDate}
                className="grid-cols-4"
                cellClassName="bg-black/35 px-2"
                valueClassName="text-xl text-cyan-200"
                labelClassName="text-[0.58rem] tracking-[0.1em]"
              />
            ) : null}
            <ActionLink href="/register" variant="primary" className="w-full">Registration Open</ActionLink>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {seriesRaces.map((race) => (
          <RaceCard key={race.id} race={race} />
        ))}
      </div>
    </section>
  );
}
