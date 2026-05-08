import Link from "next/link";
import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";
import { StewardReportForm } from "@/components/steward-report-form";
import { getAuthState } from "@/lib/auth";
import { createSupabaseServerClient, createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { formatRaceDate, safeExternalUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

type DriverRow = { id: string; display_name: string; car_number: number; user_id?: string | null; approval_status?: string };
type RaceRow = { id: string; name: string; track_name: string; race_date: string; status: string };
type ReportRow = {
  id: string;
  race_id: string;
  reported_driver_id: string;
  lap_number: number;
  description: string;
  evidence_url: string;
  incident_type?: string | null;
  corner_name?: string | null;
  timestamp_in_video?: string | null;
  status: string;
  steward_decision?: string | null;
  created_at: string;
};

export default async function StewardReportsPage() {
  const auth = await getAuthState();

  if (!isSupabaseConfigured()) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-amber-400/30 bg-amber-400/10">
          <SectionHeader
            eyebrow="Race Control"
            title="Reports Closed"
            body="Incident reporting is not open yet. Race control will announce report windows after each event."
          />
        </Card>
      </section>
    );
  }

  if (!auth.userId) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card>
          <SectionHeader
            eyebrow="Race Control"
            title="Login Required"
            body="Only logged-in approved drivers can submit or review their own steward reports."
          />
          <Link href="/login" className="inline-flex rounded bg-red-600 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-red-500">
            Login
          </Link>
        </Card>
      </section>
    );
  }

  const supabase = await createSupabaseServerClient();
  const serviceClient = createSupabaseServiceClient();
  if (!supabase || !serviceClient) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-red-400/30 bg-red-500/10">
          <SectionHeader eyebrow="Race Control" title="Reports Unavailable" body="Incident reporting is temporarily unavailable. Please contact race control through Discord." />
        </Card>
      </section>
    );
  }

  const { data: currentDriver } = await supabase
    .from("drivers")
    .select("id, display_name, car_number, user_id, approval_status")
    .eq("user_id", auth.userId)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (!currentDriver) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-amber-400/30 bg-amber-400/10">
          <SectionHeader
            eyebrow="Race Control"
            title="Approved Driver Required"
            body="Incident reporting opens after your driver application is approved. Pending applicants and viewer accounts cannot submit reports."
          />
          <Link href="/register" className="inline-flex rounded border border-cyan-400/40 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-400/10">
            View Application
          </Link>
        </Card>
      </section>
    );
  }

  const [{ data: races }, { data: drivers }, { data: reports }] = await Promise.all([
    supabase.from("races").select("id, name, track_name, race_date, status").order("race_date", { ascending: false }),
    supabase
      .from("drivers")
      .select("id, display_name, car_number")
      .eq("approval_status", "approved")
      .neq("id", currentDriver.id)
      .order("car_number", { ascending: true }),
    supabase
      .from("steward_reports")
      .select("id, race_id, reported_driver_id, lap_number, description, evidence_url, incident_type, corner_name, timestamp_in_video, status, steward_decision, created_at")
      .eq("reporting_driver_id", currentDriver.id)
      .order("created_at", { ascending: false }),
  ]);

  const raceRows = (races ?? []) as RaceRow[];
  const driverRows = (drivers ?? []) as DriverRow[];
  const reportRows = (reports ?? []) as ReportRow[];
  const raceById = new Map(raceRows.map((race) => [race.id, race]));
  const driverById = new Map(driverRows.map((driver) => [driver.id, driver]));

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionHeader
        eyebrow="Race Control"
        title="Steward Reports"
        body="Approved drivers can submit private incident reports. Your submission history and decision status are visible here."
      />
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="mb-5">
            <h3 className="text-xl font-black uppercase text-white">Submit Incident</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Reporting as #{currentDriver.car_number} {currentDriver.display_name}. Race control receives your driver identity automatically.
            </p>
          </div>
          <StewardReportForm races={raceRows} drivers={driverRows} />
        </Card>
        <div className="grid content-start gap-4">
          {reportRows.length === 0 ? (
            <Card>
              <h3 className="text-lg font-black uppercase text-white">No Reports Submitted</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Your private steward report history will appear here after submission.</p>
            </Card>
          ) : (
            reportRows.map((report) => {
              const race = raceById.get(report.race_id);
              const reported = driverById.get(report.reported_driver_id);
              return (
                <Card key={report.id}>
                  <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {race ? `${race.name} | ${formatRaceDate(race.race_date)}` : "Race"} | Lap {report.lap_number}
                      </p>
                      <h3 className="mt-1 text-lg font-black uppercase text-white">
                        Report on {reported ? `#${reported.car_number} ${reported.display_name}` : "driver"}
                      </h3>
                    </div>
                    <Badge>{report.status}</Badge>
                  </div>
                  <p className="text-sm leading-6 text-zinc-400">{report.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                    {report.incident_type ? <span>{report.incident_type}</span> : null}
                    {report.corner_name ? <span>{report.corner_name}</span> : null}
                    {report.timestamp_in_video ? <span>{report.timestamp_in_video}</span> : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-cyan-100">{report.steward_decision ?? "Decision pending"}</p>
                  <a href={safeExternalUrl(report.evidence_url)} className="mt-3 inline-block text-sm font-semibold text-red-200">
                    Evidence link
                  </a>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
