import { Trophy } from "lucide-react";
import { ActionLink, ExternalAction } from "@/components/action-link";
import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { ClassBadge } from "@/components/class-badge";
import { EmptyState } from "@/components/empty-state";
import { drivers, getDriver, getTeam, races, raceResults, teamStandings, teams } from "@/lib/league-data";
import { countryFlag, formatRaceDate, safeExternalUrl } from "@/lib/utils";
import type { Race, Standing } from "@/types/league";

export function RaceCard({ race }: { race: Race }) {
  return (
    <Card className="flex h-full flex-col justify-between gap-5 hover:border-cyan-400/30 hover:bg-zinc-900/70">
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <Badge>{race.status}</Badge>
          <Badge>{race.registrationStatus}</Badge>
        </div>
        <h3 className="text-xl font-black uppercase text-white">{race.name}</h3>
        <p className="mt-2 text-sm text-zinc-400">{race.trackName}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ClassBadge value={race.carClass} />
          <Badge>{race.category}</Badge>
        </div>
      </div>
      <div className="grid gap-3 text-sm text-zinc-300">
        <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
          <span className="text-zinc-500">Date</span>
          <span className="text-right font-semibold">{formatRaceDate(race.raceDate)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Class</span>
          <span className="font-semibold">{race.carClass}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Format</span>
          <span className="font-semibold">{race.format}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Category</span>
          <span className="font-semibold">{race.category}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Setup</span>
          <span className="font-semibold">{race.setup}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <ActionLink href={`/races/${race.id}`} variant="secondary" className="flex-1 py-2">Details</ActionLink>
        <ExternalAction href={safeExternalUrl(race.streamUrl)} className="flex-1 py-2">Stream</ExternalAction>
      </div>
    </Card>
  );
}

export function StandingsTable({ standings, mode }: { standings: Standing[]; mode: "drivers" | "teams" }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
      <div className="overflow-x-auto">
        <table className="min-w-[680px] text-left text-sm">
          <thead className="sticky top-0 bg-zinc-950 text-xs uppercase tracking-[0.16em] text-zinc-400">
            <tr>
              <th className="px-4 py-3">Pos</th>
              <th className="px-4 py-3">{mode === "drivers" ? "Driver" : "Team"}</th>
              {mode === "teams" ? <th className="px-4 py-3">Country</th> : null}
              {mode === "drivers" ? <th className="px-4 py-3">Team</th> : null}
              <th className="px-4 py-3 text-right">Pts</th>
              <th className="px-4 py-3 text-right">Wins</th>
              <th className="px-4 py-3 text-right">Podiums</th>
              <th className="px-4 py-3 text-right">Races</th>
              <th className="px-4 py-3 text-right">DNF</th>
              <th className="px-4 py-3 text-right">Pen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {standings.map((standing) => {
              const driver = getDriver(standing.driverId);
              const team = getTeam(standing.teamId ?? driver?.teamId);
              return (
                <tr key={standing.id} className="bg-zinc-950/40 transition hover:bg-white/[0.04]">
                  <td className="px-4 py-4 font-black text-white">{standing.position}</td>
                  <td className="px-4 py-4 font-semibold text-white">
                    {mode === "drivers" ? (
                      <span>
                        <span className="mr-2 text-zinc-500">#{driver?.carNumber}</span>
                        {driver?.displayName}
                      </span>
                    ) : (
                      team?.name
                    )}
                  </td>
                  {mode === "teams" ? <td className="px-4 py-4 text-zinc-300">{countryFlag(team?.country ?? "")}</td> : null}
                  {mode === "drivers" ? <td className="px-4 py-4 text-zinc-400">{team?.name ?? "N/A"}</td> : null}
                  <td className="px-4 py-4 text-right font-black text-cyan-200">{standing.totalPoints}</td>
                  <td className="px-4 py-4 text-right text-zinc-300">{standing.wins}</td>
                  <td className="px-4 py-4 text-right text-zinc-300">{standing.podiums}</td>
                  <td className="px-4 py-4 text-right text-zinc-300">{standing.racesStarted}</td>
                  <td className="px-4 py-4 text-right text-zinc-300">{standing.dnfCount}</td>
                  <td className="px-4 py-4 text-right text-red-200">{standing.penaltyPoints}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {standings.length === 0 ? <EmptyState title="No standings yet" body="Standings will publish after the first confirmed result import." /> : null}
    </div>
  );
}

export function LatestResults() {
  const completed = races.filter((race) => race.status === "completed" && raceResults.some((result) => result.raceId === race.id));
  return (
    <div className="grid gap-4">
      {completed.map((race) => {
        const podium = raceResults.filter((result) => result.raceId === race.id).sort((a, b) => a.position - b.position).slice(0, 3);
        const winner = getDriver(podium[0]?.driverId);
        return (
          <Card key={race.id} className="hover:border-cyan-400/30 hover:bg-zinc-900/70">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-300">{race.trackName}</p>
                <h3 className="mt-2 text-xl font-black uppercase text-white">{race.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{formatRaceDate(race.raceDate)}</p>
              </div>
              <div className="grid gap-2 text-sm text-zinc-300 md:min-w-72">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Trophy size={17} className="text-cyan-300" /> Winner: {winner?.displayName}
                </div>
                <p>Podium: {podium.map((result) => getDriver(result.driverId)?.displayName).join(" / ")}</p>
                <p>Fastest lap: {getDriver(podium.find((result) => result.fastestLap)?.driverId)?.displayName ?? "Not recorded"}</p>
              </div>
              <ActionLink href={`/races/${race.id}`} className="py-2">Full results</ActionLink>
            </div>
          </Card>
        );
      })}
      {completed.length === 0 ? <EmptyState title="Results pending" body="Classifications will appear after the first LMGT3 sprint race is completed." /> : null}
    </div>
  );
}

export function TeamGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {teams.map((team) => {
        const standing = teamStandings.find((item) => item.teamId === team.id);
        const roster = drivers.filter((driver) => driver.teamId === team.id);
        return (
          <Card key={team.id} className="hover:border-cyan-400/30 hover:bg-zinc-900/70">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="grid size-12 place-items-center rounded bg-white/5 text-sm font-black text-cyan-200">{team.name.slice(0, 2)}</div>
              <Badge>{team.country}</Badge>
            </div>
            <h3 className="text-lg font-black uppercase text-white">{team.name}</h3>
            <p className="mt-2 min-h-16 text-sm leading-6 text-zinc-400">{team.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <span className="rounded bg-white/5 p-2"><b className="block text-lg text-white">{standing?.totalPoints ?? 0}</b>Pts</span>
              <span className="rounded bg-white/5 p-2"><b className="block text-lg text-white">{standing?.wins ?? 0}</b>Wins</span>
              <span className="rounded bg-white/5 p-2"><b className="block text-lg text-white">{standing?.podiums ?? 0}</b>Podiums</span>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-zinc-500">Drivers</p>
            <p className="mt-2 text-sm text-zinc-300">{roster.map((driver) => driver.displayName).join(", ") || "Applications open"}</p>
          </Card>
        );
      })}
    </div>
  );
}

export function RaceResultsTable({ raceId }: { raceId: string }) {
  const results = raceResults.filter((result) => result.raceId === raceId).sort((a, b) => a.position - b.position);
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
      <div className="overflow-x-auto">
        <table className="min-w-[680px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-zinc-400">
            <tr>
              <th className="px-4 py-3">Pos</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Q</th>
              <th className="px-4 py-3">Best Lap</th>
              <th className="px-4 py-3">Gap</th>
              <th className="px-4 py-3 text-right">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {results.map((result) => {
              const driver = getDriver(result.driverId);
              const team = getTeam(result.teamId);
              return (
                <tr key={result.id} className="transition hover:bg-white/[0.04]">
                  <td className="px-4 py-4 font-black text-white">P{result.position}</td>
                  <td className="px-4 py-4 text-white">#{driver?.carNumber} {driver?.displayName}</td>
                  <td className="px-4 py-4 text-zinc-400">{team?.name}</td>
                  <td className="px-4 py-4 text-zinc-400">{result.qualifyingPosition}</td>
                  <td className="px-4 py-4 text-cyan-200">{result.bestLap}{result.fastestLap ? " FL" : ""}</td>
                  <td className="px-4 py-4 text-zinc-400">{result.gap}</td>
                  <td className="px-4 py-4 text-right font-black text-white">{result.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {results.length === 0 ? <EmptyState title="Results pending" body="Results will appear here after race control publishes a confirmed import." /> : null}
    </div>
  );
}
