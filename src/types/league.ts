export type UserRole = "admin" | "steward" | "driver" | "viewer";
export type RaceStatus = "upcoming" | "live" | "completed";
export type RegistrationStatus = "open" | "closed" | "waitlist";
export type ReportStatus = "pending" | "under_review" | "accepted" | "rejected";
export type StreamPlatform = "twitch" | "kick" | "youtube";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type LmuClass = "Hypercar" | "LMP2" | "LMGT3";
export type RaceFormatOption =
  | "Practice"
  | "Qualifying"
  | "Sprint Race"
  | "Endurance Race"
  | "Multi-class Race"
  | "Test Race"
  | "Championship Round"
  | "Special Event";
export type SetupOption = "Fixed setup" | "Open setup";

export type Driver = {
  id: string;
  displayName: string;
  realName?: string;
  country: string;
  region: string;
  carNumber: number;
  teamId?: string;
  discordUsername: string;
  steamId: string;
  preferredClass: LmuClass;
  preferredCar: string;
  rating: number;
  safetyRating: string;
  approvalStatus: "pending" | "approved" | "rejected";
};

export type Team = {
  id: string;
  name: string;
  logoUrl: string;
  country: string;
  description: string;
};

export type Championship = {
  id: string;
  name: string;
  carClass: LmuClass | "Multi-class";
  description: string;
  status: "upcoming" | "active" | "completed";
};

export type Race = {
  id: string;
  championshipId: string;
  name: string;
  trackName: string;
  raceDate: string;
  format: string;
  category: RaceFormatOption;
  setup: SetupOption;
  carClass: LmuClass | "Multi-class";
  registrationStatus: RegistrationStatus;
  status: RaceStatus;
  streamUrl: string;
  replayUrl?: string;
};

export type RaceResult = {
  id: string;
  raceId: string;
  driverId: string;
  teamId?: string;
  position: number;
  qualifyingPosition: number;
  points: number;
  bestLap: string;
  totalTime: string;
  gap: string;
  lapsCompleted: number;
  penaltiesSeconds: number;
  penaltyPoints: number;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  fastestLap: boolean;
};

export type Standing = {
  id: string;
  championshipId: string;
  driverId?: string;
  teamId?: string;
  totalPoints: number;
  wins: number;
  podiums: number;
  fastestLaps: number;
  racesStarted: number;
  dnfCount: number;
  penaltyPoints: number;
  position: number;
};

export type StewardReport = {
  id: string;
  raceId: string;
  reportingDriverId: string;
  reportedDriverId: string;
  lapNumber: number;
  description: string;
  evidenceUrl: string;
  incidentType?: string;
  cornerName?: string;
  timestampInVideo?: string;
  status: ReportStatus;
  stewardDecision?: string;
  penaltyRecommendation?: string;
  resolvedAt?: string;
  voided?: boolean;
  voidReason?: string;
};

export type NewsPost = {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  published: boolean;
  createdAt: string;
};

export type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  tier: "title" | "partner" | "community";
  active: boolean;
};

export type DriverApplication = {
  id: string;
  userId: string;
  displayName: string;
  realName: string;
  age: number;
  country: string;
  discordUsername: string;
  steamId: string;
  carNumber: number;
  preferredClass: LmuClass;
  preferredCar: string;
  safetyRank: string;
  previousLeagueExperience: boolean;
  previousLeagueExperienceDetails?: string;
  hasTeammate: boolean;
  teammateInfo?: string;
  teamName?: string;
  adminNotes?: string;
  status: ApplicationStatus;
  rejectionNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type UploadedResultRow = {
  driver_name: string;
  car_number: string;
  team_name: string;
  position: string;
  qualifying_position: string;
  best_lap: string;
  total_time: string;
  gap: string;
  laps_completed: string;
  penalties_seconds: string;
  dnf: string;
  dns: string;
  dsq: string;
  fastest_lap: string;
};

export type ImportPreviewRow = {
  rowNumber: number;
  driverName: string;
  carNumber: number | null;
  teamName: string;
  matchedDriverId?: string;
  matchedDriverName?: string;
  matchedTeamId?: string;
  matchedTeamName?: string;
  position: number;
  qualifyingPosition: number;
  points: number;
  bestLap: string;
  totalTime: string;
  gap: string;
  lapsCompleted: number;
  penaltiesSeconds: number;
  penaltyPoints: number;
  errors: string[];
  warnings: string[];
  fastestLap: boolean;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
};

export type ImportValidationSummary = {
  rows: ImportPreviewRow[];
  missingColumns: string[];
  parseErrors: string[];
  hasBlockingErrors: boolean;
  hasWarnings: boolean;
};
