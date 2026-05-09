import { Card, SectionHeader } from "@/components/card";
import { StandingsTable } from "@/components/league-tables";
import { driverStandings, teamStandings } from "@/lib/league-data";

export default function StandingsPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionHeader
        eyebrow="Championship Tables"
        title="Standings"
        body="Driver standings are empty until the first LMGT3 sprint round is completed."
      />
      <div className="grid gap-8">
        <Card>
          <h3 className="mb-4 text-xl font-black uppercase text-white">Driver Standings</h3>
          <StandingsTable standings={driverStandings} mode="drivers" />
        </Card>
        {teamStandings.length ? (
          <Card>
            <h3 className="mb-4 text-xl font-black uppercase text-white">Team Standings</h3>
            <StandingsTable standings={teamStandings} mode="teams" />
          </Card>
        ) : null}
      </div>
    </section>
  );
}
