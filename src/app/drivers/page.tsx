import Link from "next/link";
import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";
import { ClassBadge } from "@/components/class-badge";
import { drivers, getTeam } from "@/lib/league-data";
import { getPublicDrivers } from "@/lib/public-activity";
import { countryFlag } from "@/lib/utils";

export default async function DriversPage() {
  const publicDrivers = await getPublicDrivers();
  const visibleDrivers = publicDrivers?.length
    ? publicDrivers
    : drivers.map((driver) => {
        const team = getTeam(driver.teamId);
        return {
          id: driver.id,
          displayName: driver.displayName,
          country: driver.country,
          region: driver.region,
          carNumber: driver.carNumber,
          teamName: team?.name ?? null,
          preferredClass: driver.preferredClass,
          preferredCar: driver.preferredCar,
          rating: driver.rating,
          safetyRating: driver.safetyRating,
          approvalStatus: driver.approvalStatus,
        };
      });

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionHeader
        eyebrow="Paddock"
        title="Drivers"
        body="Public driver entries for the current MEL paddock, including class preference, team affiliation and race-control approval status."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleDrivers.map((driver) => {
          const hasPublicProfile = publicDrivers?.some((item) => item.id === driver.id);
          return (
            <Card key={driver.id} className="hover:border-cyan-400/30 hover:bg-zinc-900/70">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">#{driver.carNumber}</p>
                  <h3 className="mt-1 text-2xl font-black uppercase text-white">{driver.displayName}</h3>
                </div>
                <Badge>{driver.approvalStatus}</Badge>
              </div>
              <ClassBadge value={driver.preferredClass} className="mb-4" />
              <div className="grid gap-3 text-sm">
                <p className="flex justify-between gap-4"><span className="text-zinc-500">Country</span><span>{countryFlag(driver.country)} {driver.country}</span></p>
                <p className="flex justify-between gap-4"><span className="text-zinc-500">Region</span><span>{driver.region ?? "Europe"}</span></p>
                <p className="flex justify-between gap-4"><span className="text-zinc-500">Team</span><span>{driver.teamName ?? "Independent"}</span></p>
                <p className="flex justify-between gap-4"><span className="text-zinc-500">Class</span><span>{driver.preferredClass}</span></p>
                <p className="flex justify-between gap-4"><span className="text-zinc-500">Entry</span><span>{driver.preferredCar ?? "TBC"}</span></p>
                <p className="flex justify-between gap-4"><span className="text-zinc-500">Rating</span><span>{driver.rating ?? "Unrated"}</span></p>
                <p className="flex justify-between gap-4"><span className="text-zinc-500">Safety</span><span>{driver.safetyRating ?? "Pending"}</span></p>
              </div>
              <Link href={hasPublicProfile ? `/drivers/${driver.id}` : "/drivers"} className="mt-5 block rounded border border-white/10 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.16em] text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10">
                Profile
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
