export const leagueConfig = {
  leagueName: "Mediterranean Endurance League",
  shortName: "MEL",
  description:
    "A professional European Le Mans Ultimate community for clean endurance racing, transparent race control and broadcast-ready grids.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mediterranean-endurance-league.vercel.app",
  discordUrl: process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "https://discord.gg/med-endurance",
  twitchUrl: process.env.NEXT_PUBLIC_TWITCH_URL ?? "https://www.twitch.tv/medenduranceleague",
  twitchChannel: process.env.NEXT_PUBLIC_TWITCH_CHANNEL ?? "medenduranceleague",
  kickUrl: process.env.NEXT_PUBLIC_KICK_URL ?? "https://kick.com/medenduranceleague",
  logoUrl: "/logo.svg",
  primaryColor: "#dc2626",
  supportedClasses: ["Hypercar", "LMP2", "LMGT3"] as const,
  raceFormats: [
    "Practice",
    "Qualifying",
    "Sprint Race",
    "Endurance Race",
    "Multi-class Race",
    "Test Race",
    "Championship Round",
    "Special Event",
  ] as const,
  setupOptions: ["Fixed setup", "Open setup"] as const,
  pointsSystem: {
    finishing: {
      1: 25,
      2: 18,
      3: 15,
      4: 12,
      5: 10,
      6: 8,
      7: 6,
      8: 4,
      9: 2,
      10: 1,
    },
    fastestLapBonus: 1,
    allowDnfPoints: false,
  },
};

export type SupportedClass = (typeof leagueConfig.supportedClasses)[number];
export type RaceFormatOption = (typeof leagueConfig.raceFormats)[number];
export type SetupOption = (typeof leagueConfig.setupOptions)[number];
