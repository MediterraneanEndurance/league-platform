import { leagueConfig } from "@/lib/league-config";
import type {
  Championship,
  Driver,
  NewsPost,
  Race,
  RaceResult,
  Standing,
  StewardReport,
  Team,
} from "@/types/league";

export const championships: Championship[] = [
  {
    id: "mel-multiclass-2026",
    name: "MEL European Endurance Cup",
    carClass: "Multi-class",
    description:
      "A class-based Le Mans Ultimate championship for European and global sim racing drivers.",
    status: "active",
  },
];

export const teams: Team[] = [
];

export const drivers: Driver[] = [
  {
    id: "ekrem-sadi-guvendiren",
    displayName: "Ekrem Sadi Güvendiren",
    country: "",
    region: "",
    carNumber: 5,
    discordUsername: "",
    steamId: "",
    preferredClass: "LMGT3",
    preferredCar: "BMW M4 GT3",
    rating: 0,
    safetyRating: "",
    approvalStatus: "approved",
  },
];

export const races: Race[] = [
  {
    id: "round-1-spa-francorchamps",
    championshipId: "mel-multiclass-2026",
    name: "June 12 - Spa-Francorchamps",
    trackName: "Circuit de Spa-Francorchamps",
    raceDate: "2026-06-12T21:00:00+03:00",
    format: "20m Qualifying + 40m Sprint Race",
    category: "Sprint Race",
    setup: "Fixed setup",
    carClass: "LMGT3",
    registrationStatus: "open",
    status: "upcoming",
    streamUrl: leagueConfig.twitchUrl,
  },
  {
    id: "round-2-monza",
    championshipId: "mel-multiclass-2026",
    name: "June 19 - Monza",
    trackName: "Autodromo Nazionale Monza",
    raceDate: "2026-06-19T21:00:00+03:00",
    format: "20m Qualifying + 40m Sprint Race",
    category: "Sprint Race",
    setup: "Fixed setup",
    carClass: "LMGT3",
    registrationStatus: "open",
    status: "upcoming",
    streamUrl: leagueConfig.twitchUrl,
  },
  {
    id: "round-3-fuji",
    championshipId: "mel-multiclass-2026",
    name: "June 26 - Fuji Speedway",
    trackName: "Fuji Speedway",
    raceDate: "2026-06-26T21:00:00+03:00",
    format: "20m Qualifying + 40m Sprint Race",
    category: "Sprint Race",
    setup: "Fixed setup",
    carClass: "LMGT3",
    registrationStatus: "open",
    status: "upcoming",
    streamUrl: leagueConfig.twitchUrl,
  },
  {
    id: "round-4-le-mans",
    championshipId: "mel-multiclass-2026",
    name: "July 3 - Le Mans",
    trackName: "Circuit de la Sarthe",
    raceDate: "2026-07-03T21:00:00+03:00",
    format: "20m Qualifying + 40m Sprint Race",
    category: "Sprint Race",
    setup: "Fixed setup",
    carClass: "LMGT3",
    registrationStatus: "open",
    status: "upcoming",
    streamUrl: leagueConfig.twitchUrl,
  },
  {
    id: "preseason-portimao",
    championshipId: "mel-multiclass-2026",
    name: "Preseason Test - Portimao",
    trackName: "Algarve International Circuit",
    raceDate: "2026-05-03T18:00:00+02:00",
    format: "Practice + Qualifying + Test Race",
    category: "Test Race",
    setup: "Fixed setup",
    carClass: "LMGT3",
    registrationStatus: "closed",
    status: "test",
    streamUrl: leagueConfig.twitchUrl,
    replayUrl: "https://www.youtube.com/@medenduranceleague",
  },
];

export const raceResults: RaceResult[] = [];

export const driverStandings: Standing[] = [
  {
    id: "standing-ekrem-sadi-guvendiren",
    championshipId: "mel-multiclass-2026",
    driverId: "ekrem-sadi-guvendiren",
    totalPoints: 0,
    wins: 0,
    podiums: 0,
    fastestLaps: 0,
    racesStarted: 0,
    dnfCount: 0,
    penaltyPoints: 0,
    position: 1,
  },
];

export const teamStandings: Standing[] = [];

export const stewardReports: StewardReport[] = [];

export const newsPosts: NewsPost[] = [
  {
    id: "news-1",
    title: "Driver applications open for the first MEL endurance season",
    body: "Applications are reviewed manually to keep the grid clean, respectful and broadcast-ready.",
    published: true,
    createdAt: "2026-05-07T09:00:00+02:00",
  },
  {
    id: "news-2",
    title: "Preseason test complete at Portimao",
    body: "Race control validated the result import workflow and steward reporting process after the first community test.",
    published: true,
    createdAt: "2026-05-04T21:00:00+02:00",
  },
];

export const getTeam = (teamId?: string) => teams.find((team) => team.id === teamId);
export const getDriver = (driverId?: string) => drivers.find((driver) => driver.id === driverId);
export const getRace = (raceId?: string) => races.find((race) => race.id === raceId);

export const nextRace =
  races
    .filter((race) => race.status === "upcoming" || race.status === "live")
    .sort((a, b) => new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime())[0] ?? races[0];
