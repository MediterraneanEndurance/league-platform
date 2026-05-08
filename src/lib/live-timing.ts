export type LiveTimingDriver = {
  driverId: string;
  carNumber: number;
  position: number;
  currentLap: number;
  bestLap?: string;
  gap?: string;
  inPit: boolean;
};

export type LiveTimingSnapshot = {
  raceId: string;
  sessionType: "practice" | "qualifying" | "race";
  receivedAt: string;
  drivers: LiveTimingDriver[];
};

export async function ingestLiveTimingSnapshot(snapshot: LiveTimingSnapshot) {
  return snapshot;
}
