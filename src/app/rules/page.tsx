import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";

const leagueSettings = [
  ["Platform", "Le Mans Ultimate (LMU)"],
  ["Server Location", "Europe, GMT+3 / TRT timezone"],
  ["Race Day", "Every Friday @ 21:00 TRT / 20:00 CEST"],
  ["Series Format", "Sprint Series with Tactical Pitstops"],
];

const technicalRules = [
  {
    title: "Qualifying",
    value: "20 minutes",
    body: "Public session. Traffic management is required on out laps, in laps and preparation laps.",
  },
  {
    title: "Race",
    value: "40 minutes",
    body: "Compact sprint distance with no room for careless incidents or poor pit strategy.",
  },
  {
    title: "Setup",
    value: "Fixed setup",
    body: "Pure skill-based racing. Drivers compete on the same baseline package.",
    badge: "Fixed Setup",
  },
  {
    title: "Damage",
    value: "50%",
    body: "Beginner friendly, but still punishing enough to reward clean race craft.",
  },
  {
    title: "Multipliers",
    value: "3x tire / 3x fuel",
    body: "A pit stop is tactically mandatory to finish the race cleanly.",
    badge: "3x Wear",
  },
  {
    title: "Time & Weather",
    value: "3x time scale",
    body: "Dynamic weather with a 17:30 in-game start for a sunset finish.",
  },
];

const rules = [
  {
    id: "racing-conduct",
    title: "Racing Conduct",
    body: "Every driver is expected to race predictably, leave racing room when overlap is established and respect the rhythm of multi-class endurance traffic. Aggression is acceptable only when it remains controlled, readable and fair.",
  },
  {
    id: "avoidable-contact",
    title: "Avoidable Contact",
    body: "Contact caused by late moves, missed braking points, squeezing without room or rejoining into traffic may be reviewed as avoidable. Race Control looks at car position, closing speed, available space and whether the driver could reasonably prevent the incident.",
  },
  {
    id: "track-limits",
    title: "Track Limits",
    body: "Le Mans Ultimate track-limit enforcement is authoritative unless an event briefing states otherwise. Repeated abuse, deliberate off-track gains or failure to give back a gained advantage can lead to time penalties or penalty points.",
  },
  {
    id: "unsafe-rejoins",
    title: "Unsafe Rejoins",
    body: "A car returning from the grass, gravel, runoff or pit exit must do so safely and without forcing another driver to react sharply. Drivers must wait, angle the car predictably and rejoin parallel to traffic where possible.",
  },
  {
    id: "blue-flags",
    title: "Blue Flags",
    body: "Lapped and slower-class cars should hold a stable line and make the pass predictable. Faster cars remain responsible for completing the overtake safely, especially in braking zones and high-speed traffic.",
  },
  {
    id: "qualifying",
    title: "Qualifying Behavior",
    body: "Drivers on out laps or in laps must avoid blocking active flying laps. Build gaps before beginning a lap, respect pit exit blend lines and avoid sudden slowing on the racing line.",
  },
  {
    id: "protests",
    title: "Protests And Stewarding",
    body: "Incident reports must include the race, lap, drivers involved, a clear description and supporting video where available. Stewards review only the submitted incident and publish a public summary once a decision is finalized.",
  },
  {
    id: "penalties",
    title: "Penalties",
    body: "Available penalties include warnings, time penalties, penalty points, qualifying restrictions, race bans and disqualification. Penalties are chosen according to impact, intent, repeat behavior and whether the driver corrected the advantage.",
  },
  {
    id: "sportsmanship",
    title: "Sportsmanship",
    body: "The league expects calm communication, no retaliation and respect for volunteer race-control decisions. Drivers may disagree with a ruling, but all appeals and questions must remain factual and constructive.",
  },
  {
    id: "points",
    title: "Points System",
    body: "P1 25, P2 18, P3 15, P4 12, P5 10, P6 8, P7 6, P8 4, P9 2, P10 1. Fastest lap may receive one bonus point when the driver is classified in the eligible results.",
  },
];

export default function RulesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeader
        eyebrow="Regulations"
        title="Sporting Code"
        body="International LMU sprint regulations for Friday night racing, tactical pitstops and clean race-control operations."
      />
      <div className="mb-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-cyan-400/20 bg-cyan-400/5">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge tone="border-red-400/50 bg-red-600/15 text-red-100">Fixed Setup</Badge>
            <Badge tone="border-cyan-300/50 bg-cyan-300/10 text-cyan-100">3x Wear</Badge>
            <Badge tone="border-cyan-300/50 bg-cyan-300/10 text-cyan-100">3x Fuel</Badge>
          </div>
          <h3 className="text-xl font-black uppercase text-white">General League Settings</h3>
          <div className="mt-5 grid gap-3">
            {leagueSettings.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-t border-white/10 pt-3 text-sm">
                <span className="text-zinc-500">{label}</span>
                <span className="text-right font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-xl font-black uppercase text-white">Technical Session Rules</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {technicalRules.map((rule) => (
              <div key={rule.title} className="rounded border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{rule.title}</p>
                  {rule.badge ? <Badge tone="border-cyan-300/50 bg-cyan-300/10 text-cyan-100">{rule.badge}</Badge> : null}
                </div>
                <p className="mt-2 text-lg font-black uppercase text-white">{rule.value}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{rule.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <nav className="mb-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Sporting code sections">
        {rules.map((rule, index) => (
          <a
            key={rule.id}
            className="rounded border border-white/10 bg-white/[0.03] px-3 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
            href={`#${rule.id}`}
          >
            {String(index + 1).padStart(2, "0")} {rule.title}
          </a>
        ))}
      </nav>
      <div className="grid gap-4">
        {rules.map((rule, index) => (
          <div key={rule.id} id={rule.id} className="scroll-mt-28">
            <Card>
              <div className="flex gap-4">
                <span className="text-2xl font-black text-cyan-300">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-xl font-black uppercase text-white">{rule.title}</h3>
                  <p className="mt-2 leading-7 text-zinc-400">{rule.body}</p>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
}
