import Link from "next/link";
import { Card, SectionHeader } from "@/components/card";
import { getDriver, races, raceResults } from "@/lib/league-data";
import { formatRaceDate } from "@/lib/utils";

export default function ResultsPage() {
  const completed = races.filter((race) => race.status === "completed");

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionHeader
        eyebrow="Race History"
        title="Results"
        body="Full race result history with winners, podiums, fastest laps and replay links."
      />
      <div className="grid gap-4">
        {completed.map((race) => {
          const results = raceResults.filter((result) => result.raceId === race.id).sort((a, b) => a.position - b.position);
          const fastest = results.find((result) => result.fastestLap);
          return (
            <Card key={race.id}>
              <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-red-300">{formatRaceDate(race.raceDate)}</p>
                  <h3 className="mt-2 text-2xl font-black uppercase text-white">{race.name}</h3>
                  <p className="mt-1 text-zinc-400">{race.trackName}</p>
                </div>
                <div className="text-sm leading-7 text-zinc-300">
                  <p>Winner: <span className="font-bold text-white">{getDriver(results[0]?.driverId)?.displayName}</span></p>
                  <p>Podium: {results.slice(0, 3).map((result) => getDriver(result.driverId)?.displayName).join(" / ")}</p>
                  <p>Fastest lap: {getDriver(fastest?.driverId)?.displayName} {fastest?.bestLap}</p>
                </div>
                <Link href={`/races/${race.id}`} className="rounded bg-white px-4 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-black">
                  View full results
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
