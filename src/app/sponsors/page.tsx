import { ExternalAction } from "@/components/action-link";
import { Card, SectionHeader } from "@/components/card";
import { leagueConfig } from "@/lib/league-config";

export default function SponsorsPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <SectionHeader
        eyebrow="Community"
        title="Partnerships"
        body="MEL is open to aligned endurance racing partners, broadcast collaborators and community supporters. Confirmed partners will be announced only after league approval."
      />
      <Card className="border-cyan-400/20 bg-cyan-400/5">
        <h2 className="text-2xl font-black uppercase text-white">Partnership Enquiries</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
          Partnership discussions are handled directly by league staff. Public partner placement is reserved for confirmed organisations
          that support clean racing, broadcast presentation or community endurance events.
        </p>
        <ExternalAction href={leagueConfig.discordUrl} variant="secondary" className="mt-6">
          Contact On Discord
        </ExternalAction>
      </Card>
    </section>
  );
}
