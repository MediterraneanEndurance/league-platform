"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Scale } from "lucide-react";
import { addPenaltyForReport, updateStewardReport, voidStewardReport } from "@/app/steward/actions";
import { emptyStewardActionState } from "@/app/steward/steward-action-types";
import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { safeExternalUrl } from "@/lib/utils";

export type StewardReportDashboardRow = {
  id: string;
  race_id: string;
  reporting_driver_id: string;
  reported_driver_id: string;
  lap_number: number;
  description: string;
  evidence_url: string;
  incident_type?: string | null;
  corner_name?: string | null;
  timestamp_in_video?: string | null;
  status: string;
  steward_decision?: string | null;
  penalty_recommendation?: string | null;
  resolved_at?: string | null;
  voided?: boolean;
  void_reason?: string | null;
  created_at: string;
};

type Lookup = { id: string; name: string; detail?: string };
type PenaltyRow = { id: string; report_id?: string | null; driver_id: string; race_id: string; reason: string; seconds: number; penalty_points: number; steward_note?: string | null };

function Message({ ok, message }: { ok: boolean; message: string }) {
  if (!message) return null;
  return (
    <div className={`flex items-start gap-2 rounded border p-3 text-sm ${ok ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-50" : "border-red-400/30 bg-red-500/10 text-red-50"}`}>
      {ok ? <CheckCircle2 className="mt-0.5 shrink-0" size={17} /> : <AlertTriangle className="mt-0.5 shrink-0" size={17} />}
      {message}
    </div>
  );
}

function ReviewPanel({
  report,
  races,
  drivers,
  penalties,
  isAdmin,
}: {
  report: StewardReportDashboardRow;
  races: Map<string, Lookup>;
  drivers: Map<string, Lookup>;
  penalties: PenaltyRow[];
  isAdmin: boolean;
}) {
  const [decisionState, decisionAction, decisionPending] = useActionState(updateStewardReport, emptyStewardActionState);
  const [penaltyState, penaltyAction, penaltyPending] = useActionState(addPenaltyForReport, emptyStewardActionState);
  const [voidState, voidAction, voidPending] = useActionState(voidStewardReport, emptyStewardActionState);
  const race = races.get(report.race_id);
  const reporting = drivers.get(report.reporting_driver_id);
  const reported = drivers.get(report.reported_driver_id);
  const reportPenalties = penalties.filter((penalty) => penalty.report_id === report.id);

  return (
    <Card className="grid gap-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{race?.name ?? "Race"} | Lap {report.lap_number}</p>
          <h3 className="mt-1 text-xl font-black uppercase text-white">
            {reporting?.name ?? "Reporting driver"} vs {reported?.name ?? "Reported driver"}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">{race?.detail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{report.status}</Badge>
          {report.resolved_at ? <Badge tone="border-cyan-400/40 bg-cyan-400/10 text-cyan-100">resolved</Badge> : null}
          {report.voided ? <Badge tone="border-zinc-600 bg-zinc-800 text-zinc-300">voided</Badge> : null}
        </div>
      </div>

      <div className="rounded border border-white/10 bg-black/35 p-4">
        <div className="mb-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
          {report.incident_type ? <span>{report.incident_type}</span> : null}
          {report.corner_name ? <span>{report.corner_name}</span> : null}
          {report.timestamp_in_video ? <span>{report.timestamp_in_video}</span> : null}
        </div>
        <p className="text-sm leading-6 text-zinc-300">{report.description}</p>
        <a href={safeExternalUrl(report.evidence_url)} className="mt-3 inline-block text-sm font-semibold text-red-200">
          Open evidence
        </a>
      </div>

      <form action={decisionAction} className="grid gap-3">
        <input type="hidden" name="report_id" value={report.id} />
        <label className="grid gap-2 text-sm font-semibold text-white">
          Status
          <select name="status" defaultValue={report.status} className="rounded border border-white/10 bg-black p-3 text-sm text-white">
            <option value="pending">Pending</option>
            <option value="under_review">Under review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-white">
          Steward decision
          <textarea name="steward_decision" defaultValue={report.steward_decision ?? ""} className="min-h-28 rounded border border-white/10 bg-black p-3 text-sm leading-6 text-white" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-white">
          Penalty recommendation
          <input name="penalty_recommendation" defaultValue={report.penalty_recommendation ?? ""} className="rounded border border-white/10 bg-black p-3 text-sm text-white" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <input name="resolved" type="checkbox" defaultChecked={Boolean(report.resolved_at)} className="size-4 accent-cyan-400" />
          Mark as resolved
        </label>
        <Message ok={decisionState.ok} message={decisionState.message} />
        <button className="rounded bg-red-600 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-red-500 disabled:opacity-60" disabled={decisionPending} type="submit">
          {decisionPending ? "Saving..." : "Save Decision"}
        </button>
      </form>

      <form action={penaltyAction} className="grid gap-3 rounded border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-white"><Scale size={17} className="text-cyan-300" /> Add Penalty</div>
        <input type="hidden" name="report_id" value={report.id} />
        <input type="hidden" name="race_id" value={report.race_id} />
        <input type="hidden" name="driver_id" value={report.reported_driver_id} />
        <label className="grid gap-2 text-sm font-semibold text-white">
          Reason
          <input name="reason" placeholder="Avoidable contact, unsafe rejoin, track limits..." className="rounded border border-white/10 bg-black p-3 text-sm text-white" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-white">
            Seconds
            <input name="seconds" type="number" min="0" defaultValue="0" className="rounded border border-white/10 bg-black p-3 text-sm text-white" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-white">
            Penalty points
            <input name="penalty_points" type="number" min="0" defaultValue="0" className="rounded border border-white/10 bg-black p-3 text-sm text-white" />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-white">
          Steward note
          <textarea name="steward_note" className="min-h-20 rounded border border-white/10 bg-black p-3 text-sm text-white" />
        </label>
        <Message ok={penaltyState.ok} message={penaltyState.message} />
        <button className="rounded border border-cyan-400/40 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-400/10 disabled:opacity-60" disabled={penaltyPending} type="submit">
          {penaltyPending ? "Saving..." : "Save Penalty"}
        </button>
      </form>

      {reportPenalties.length > 0 ? (
        <div className="grid gap-2">
          {reportPenalties.map((penalty) => (
            <div key={penalty.id} className="rounded bg-white/5 p-3 text-sm text-zinc-300">
              <span className="font-semibold text-white">{penalty.reason}</span> | {penalty.seconds}s | {penalty.penalty_points} points
            </div>
          ))}
        </div>
      ) : null}

      {isAdmin ? (
        <form action={voidAction} className="grid gap-3 border-t border-white/10 pt-4">
          <input type="hidden" name="report_id" value={report.id} />
          <label className="grid gap-2 text-sm font-semibold text-white">
            Admin void reason
            <input name="void_reason" className="rounded border border-white/10 bg-black p-3 text-sm text-white" />
          </label>
          <Message ok={voidState.ok} message={voidState.message} />
          <button className="rounded border border-zinc-600 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-zinc-200 transition hover:bg-white/5 disabled:opacity-60" disabled={voidPending} type="submit">
            Void Report
          </button>
        </form>
      ) : null}
    </Card>
  );
}

export function StewardDashboard({
  reports,
  races,
  drivers,
  penalties,
  isAdmin,
}: {
  reports: StewardReportDashboardRow[];
  races: Lookup[];
  drivers: Lookup[];
  penalties: PenaltyRow[];
  isAdmin: boolean;
}) {
  const [selectedId, setSelectedId] = useState(reports[0]?.id ?? "");
  const selected = reports.find((report) => report.id === selectedId) ?? reports[0];
  const raceMap = new Map(races.map((race) => [race.id, race]));
  const driverMap = new Map(drivers.map((driver) => [driver.id, driver]));

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <div className="mb-4 flex items-center gap-2 text-xl font-black uppercase text-white">
          <FileText size={20} className="text-cyan-300" /> Report Queue
        </div>
        {reports.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-500">No steward reports are waiting in race control.</p>
        ) : (
          <div className="grid gap-3">
            {reports.map((report) => (
              <button
                key={report.id}
                className={`rounded border p-3 text-left transition ${selected?.id === report.id ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                onClick={() => setSelectedId(report.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black uppercase text-white">Lap {report.lap_number}</span>
                  <Badge>{report.status}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{report.description}</p>
              </button>
            ))}
          </div>
        )}
      </Card>
      {selected ? <ReviewPanel report={selected} races={raceMap} drivers={driverMap} penalties={penalties} isAdmin={isAdmin} /> : null}
    </div>
  );
}
