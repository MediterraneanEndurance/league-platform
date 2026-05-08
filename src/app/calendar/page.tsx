import { SectionHeader } from "@/components/card";
import { RaceCard } from "@/components/league-tables";
import { races } from "@/lib/league-data";

export default function CalendarPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionHeader
        eyebrow="Season Calendar"
        title="Race Schedule"
        body="Race weekends, entry status, broadcast links and event details for drivers and spectators."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {races.map((race) => (
          <RaceCard key={race.id} race={race} />
        ))}
      </div>
    </section>
  );
}
