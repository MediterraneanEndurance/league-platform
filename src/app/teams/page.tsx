import { SectionHeader } from "@/components/card";
import { TeamGrid } from "@/components/league-tables";

export default function TeamsPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionHeader
        eyebrow="Teams"
        title="Entrants"
        body="Endurance teams, independent entries and championship points across the active season."
      />
      <TeamGrid />
    </section>
  );
}
