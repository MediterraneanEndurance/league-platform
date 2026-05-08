import { leagueConfig } from "@/lib/league-config";

export function SessionStrip() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {leagueConfig.raceFormats.slice(0, 4).map((format, index) => (
        <div key={format} className="rounded border border-white/10 bg-black/50 p-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Session {index + 1}</p>
          <p className="mt-1 font-black uppercase text-white">{format}</p>
        </div>
      ))}
    </div>
  );
}
