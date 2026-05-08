import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";

export const runtime = "nodejs";

const BOT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|uptime|curl|wget|python|go-http-client|headless/i;

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

function visitorHash(ip: string, userAgent: string, date: string) {
  const salt = process.env.VISIT_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "mel-public-visits";
  return createHash("sha256").update(`${salt}:${date}:${ip}:${userAgent}`).digest("hex");
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return Response.json({ ok: true, counted: false }, { status: 202 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT_PATTERN.test(userAgent)) {
    return Response.json({ ok: true, counted: false }, { status: 202 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ ok: true, counted: false }, { status: 202 });
  }

  const body = await request.json().catch(() => ({} as { path?: unknown }));
  const rawPath = typeof body.path === "string" ? body.path : "/";
  const path = rawPath.startsWith("/") ? rawPath.slice(0, 120) : "/";
  const visitDate = new Date().toISOString().slice(0, 10);
  const hash = visitorHash(clientIp(request), userAgent, visitDate);

  const { error } = await supabase.from("community_visits").upsert(
    {
      visit_date: visitDate,
      visitor_hash: hash,
      path,
    },
    {
      onConflict: "visit_date,visitor_hash",
      ignoreDuplicates: true,
    },
  );

  if (!error) revalidateTag("public-activity-stats", "max");

  return Response.json({ ok: true, counted: !error }, { status: 202 });
}
