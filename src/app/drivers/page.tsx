import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";
import { ClassBadge } from "@/components/class-badge";
import { drivers, getTeam } from "@/lib/league-data";

export default async function DriversPage() {
  const visibleDrivers = drivers.map((driver) => {
    const team = getTeam(driver.teamId);
    return {
      id: driver.id,
      displayName: driver.displayName,
      carNumber: driver.carNumber,
      teamName: team?.name ?? null,
      preferredClass: driver.preferredClass,
      preferredCar: driver.preferredCar,
      approvalStatus: driver.approvalStatus,
    };
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionHeader
        eyebrow="Paddock"
        title="Drivers"
        body="Public LMGT3 driver entries for the current MEL paddock, including car number, team status and selected car."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleDrivers.map((driver) => (
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
              <p className="flex justify-between gap-4"><span className="text-zinc-500">Team</span><span>{driver.teamName ?? "N/A"}</span></p>
              <p className="flex justify-between gap-4"><span className="text-zinc-500">Class</span><span>{driver.preferredClass}</span></p>
              <p className="flex justify-between gap-4"><span className="text-zinc-500">Entry</span><span>{driver.preferredCar ?? "TBC"}</span></p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
