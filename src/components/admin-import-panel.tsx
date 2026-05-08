"use client";

import dynamic from "next/dynamic";

const ResultImporter = dynamic(() => import("@/components/result-importer").then((mod) => mod.ResultImporter), {
  ssr: false,
  loading: () => (
    <div className="rounded border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">Loading import tools...</div>
  ),
});

export type ImportRaceOption = {
  id: string;
  name: string;
  track_name: string;
  race_date: string;
  status: string;
  championship_id: string;
  result_count?: number;
};

export type ImportDriverOption = {
  id: string;
  display_name: string;
  car_number: number;
  steam_id?: string | null;
  team_id?: string | null;
};

export type ImportTeamOption = {
  id: string;
  name: string;
};

export function AdminImportPanel({
  races,
  drivers,
  teams,
}: {
  races: ImportRaceOption[];
  drivers: ImportDriverOption[];
  teams: ImportTeamOption[];
}) {
  return <ResultImporter races={races} drivers={drivers} teams={teams} />;
}
