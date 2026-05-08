export type IntegrationStatus = "planned" | "ready" | "connected";

export type IntegrationDefinition = {
  id: string;
  name: string;
  owner: "race-control" | "community" | "operations";
  status: IntegrationStatus;
  purpose: string;
};

export const futureIntegrations: IntegrationDefinition[] = [
  {
    id: "live-timing",
    name: "Live Timing API",
    owner: "race-control",
    status: "planned",
    purpose: "Receive LMU/rFactor 2 timing snapshots and publish session state.",
  },
  {
    id: "discord-bot",
    name: "Discord Bot",
    owner: "community",
    status: "planned",
    purpose: "Announce race schedules, steward deadlines and published results.",
  },
  {
    id: "standings-sync",
    name: "Automated Standings Sync",
    owner: "race-control",
    status: "planned",
    purpose: "Recalculate driver and team tables after confirmed imports.",
  },
  {
    id: "driver-rating",
    name: "Driver Rating",
    owner: "operations",
    status: "planned",
    purpose: "Track pace, attendance and split placement over a season.",
  },
  {
    id: "safety-rating",
    name: "Safety Rating",
    owner: "race-control",
    status: "planned",
    purpose: "Use incidents, DNFs and steward decisions to inform grid eligibility.",
  },
  {
    id: "season-archives",
    name: "Season Archives",
    owner: "operations",
    status: "planned",
    purpose: "Keep completed calendars, standings, results and replays browsable.",
  },
];
