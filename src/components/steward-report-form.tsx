"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { submitStewardReport } from "@/app/steward-reports/actions";
import { emptyStewardReportState } from "@/app/steward-reports/steward-report-action-types";

type RaceOption = { id: string; name: string; track_name: string; race_date: string; status: string };
type DriverOption = { id: string; display_name: string; car_number: number };

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs font-semibold text-red-200">{message}</p> : null;
}

export function StewardReportForm({ races, drivers }: { races: RaceOption[]; drivers: DriverOption[] }) {
  const [state, action, pending] = useActionState(submitStewardReport, emptyStewardReportState);

  return (
    <form action={action} className="grid gap-4">
      {state.message ? (
        <div className={`flex items-start gap-3 rounded border p-3 text-sm ${state.ok ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-50" : "border-red-400/30 bg-red-500/10 text-red-50"}`}>
          {state.ok ? <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> : <AlertTriangle className="mt-0.5 shrink-0" size={18} />}
          <span>{state.message}</span>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-semibold text-white">
        Race
        <select name="race_id" className="rounded border border-white/10 bg-black p-3 text-sm text-white" required>
          <option value="">Select race</option>
          {races.map((race) => (
            <option key={race.id} value={race.id}>
              {race.name} - {race.track_name}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-zinc-500">Choose the event where the incident occurred.</span>
        <FieldError message={state.fieldErrors?.race_id} />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-white">
        Reported driver
        <select name="reported_driver_id" className="rounded border border-white/10 bg-black p-3 text-sm text-white" required>
          <option value="">Select driver</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              #{driver.car_number} {driver.display_name}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-zinc-500">Your own approved driver profile is attached automatically.</span>
        <FieldError message={state.fieldErrors?.reported_driver_id} />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-white">
          Lap number
          <input name="lap_number" type="number" min="1" className="rounded border border-white/10 bg-black p-3 text-sm text-white" required />
          <FieldError message={state.fieldErrors?.lap_number} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-white">
          Incident type
          <select name="incident_type" className="rounded border border-white/10 bg-black p-3 text-sm text-white">
            <option value="">Optional</option>
            <option value="Contact">Contact</option>
            <option value="Unsafe rejoin">Unsafe rejoin</option>
            <option value="Blocking">Blocking</option>
            <option value="Track limits">Track limits</option>
            <option value="Blue flag">Blue flag</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-white">
          Video timestamp
          <input name="timestamp_in_video" placeholder="01:23:45" className="rounded border border-white/10 bg-black p-3 text-sm text-white" />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-white">
        Corner name
        <input name="corner_name" placeholder="Optional, for example Turn 1 or Mulsanne" className="rounded border border-white/10 bg-black p-3 text-sm text-white" />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-white">
        Incident description
        <textarea
          name="incident_description"
          className="min-h-36 rounded border border-white/10 bg-black p-3 text-sm leading-6 text-white"
          placeholder="Describe the cars involved, racing line, braking point, overlap and outcome."
          required
        />
        <FieldError message={state.fieldErrors?.incident_description} />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-white">
        Evidence URL
        <input name="evidence_url" type="url" placeholder="https://..." className="rounded border border-white/10 bg-black p-3 text-sm text-white" required />
        <span className="text-xs font-normal text-zinc-500">Use a Twitch, YouTube, Kick, Drive or cloud replay clip link that stewards can open.</span>
        <FieldError message={state.fieldErrors?.evidence_url} />
      </label>

      <button
        className="rounded bg-red-600 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={pending || races.length === 0 || drivers.length === 0}
      >
        {pending ? "Submitting..." : "Submit To Race Control"}
      </button>
    </form>
  );
}
