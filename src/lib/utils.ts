import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRaceDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
}

export function daysUntil(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function countryFlag(country: string) {
  const map: Record<string, string> = {
    Austria: "AT",
    Belgium: "BE",
    Germany: "DE",
    France: "FR",
    Italy: "IT",
    Netherlands: "NL",
    Portugal: "PT",
    Spain: "ES",
    "United Kingdom": "GB",
    Europe: "EU",
  };
  const code = map[country] ?? "EU";
  if (code === "EU") return "EU";
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function statusTone(status: string) {
  if (status === "live" || status === "open" || status === "active" || status === "accepted") {
    return "border-cyan-400/40 bg-cyan-400/10 text-cyan-100";
  }
  if (status === "completed" || status === "closed" || status === "rejected") {
    return "border-zinc-600 bg-zinc-800 text-zinc-300";
  }
  if (status === "under_review" || status === "waitlist") {
    return "border-amber-400/40 bg-amber-400/10 text-amber-100";
  }
  return "border-red-400/40 bg-red-500/10 text-red-100";
}

export function safeExternalUrl(value: string | undefined) {
  if (!value) return "#";
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : "#";
  } catch {
    return "#";
  }
}
