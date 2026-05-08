"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { submitDriverApplication } from "@/app/register/actions";
import type { ApplicationActionState } from "@/app/register/application-action-types";
import { leagueConfig } from "@/lib/league-config";

const initialState: ApplicationActionState = {
  ok: false,
  message: "",
};

type ExistingApplication = {
  display_name?: string;
  real_name?: string;
  age?: number;
  country?: string;
  discord_username?: string;
  steam_id?: string;
  car_number?: number;
  preferred_class?: string;
  preferred_car?: string;
  safety_rank?: string;
  previous_league_experience?: boolean;
  previous_league_experience_details?: string;
  has_teammate?: boolean;
  teammate_info?: string;
  team_name?: string;
  status?: string;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs font-semibold text-red-200">{message}</p> : null;
}

function Helper({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-5 text-zinc-500">{children}</p>;
}

export function DriverApplicationForm({
  configured,
  signedIn,
  existingApplication,
}: Readonly<{ configured: boolean; signedIn: boolean; existingApplication?: ExistingApplication | null }>) {
  const [state, formAction, pending] = useActionState(submitDriverApplication, initialState);
  const [hasExperience, setHasExperience] = useState(existingApplication?.previous_league_experience ? "yes" : "no");
  const [hasTeammate, setHasTeammate] = useState(existingApplication?.has_teammate ? "yes" : "no");
  const disabled = !configured || !signedIn || existingApplication?.status === "approved";

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Display name
          <input name="display_name" defaultValue={existingApplication?.display_name} className="rounded border border-white/10 bg-black p-3 text-white" required disabled={disabled} />
          <Helper>Used on standings, broadcast overlays and public entry lists.</Helper>
          <FieldError message={state.fieldErrors?.display_name} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Real full name
          <input name="real_name" defaultValue={existingApplication?.real_name} className="rounded border border-white/10 bg-black p-3 text-white" required disabled={disabled} />
          <Helper>Visible only to race control unless the league later publishes real-name rosters.</Helper>
          <FieldError message={state.fieldErrors?.real_name} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Age
          <input name="age" defaultValue={existingApplication?.age} className="rounded border border-white/10 bg-black p-3 text-white" type="number" min="13" max="80" required disabled={disabled} />
          <Helper>Required for eligibility and community safeguarding. Accepted range: 13-80.</Helper>
          <FieldError message={state.fieldErrors?.age} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Country
          <input name="country" defaultValue={existingApplication?.country} className="rounded border border-white/10 bg-black p-3 text-white" required disabled={disabled} />
          <Helper>Used for neutral flag display and regional scheduling context.</Helper>
          <FieldError message={state.fieldErrors?.country} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Discord username
          <input name="discord_username" defaultValue={existingApplication?.discord_username} className="rounded border border-white/10 bg-black p-3 text-white" required disabled={disabled} />
          <Helper>Race control uses Discord for briefings, steward contact and attendance checks.</Helper>
          <FieldError message={state.fieldErrors?.discord_username} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Steam ID
          <input name="steam_id" defaultValue={existingApplication?.steam_id} className="rounded border border-white/10 bg-black p-3 text-white" required disabled={disabled} />
          <Helper>Required to match LMU entries and prevent duplicate applications.</Helper>
          <FieldError message={state.fieldErrors?.steam_id} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Car number
          <input name="car_number" defaultValue={existingApplication?.car_number} className="rounded border border-white/10 bg-black p-3 text-white" type="number" min="1" max="999" required disabled={disabled} />
          <Helper>Must be unique across approved drivers and pending applications.</Helper>
          <FieldError message={state.fieldErrors?.car_number} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Preferred LMU class
          <select name="preferred_class" defaultValue={existingApplication?.preferred_class ?? ""} className="rounded border border-white/10 bg-black p-3 text-white" required disabled={disabled}>
            <option value="" disabled>Select LMU class</option>
            {leagueConfig.supportedClasses.map((item) => <option key={item}>{item}</option>)}
          </select>
          <Helper>Choose the class you are most prepared to race in Season 1.</Helper>
          <FieldError message={state.fieldErrors?.preferred_class} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Preferred car
          <input name="preferred_car" defaultValue={existingApplication?.preferred_car} className="rounded border border-white/10 bg-black p-3 text-white" required disabled={disabled} />
          <Helper>Use a specific LMU car if known, or describe your planned class entry.</Helper>
          <FieldError message={state.fieldErrors?.preferred_car} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Safety rank / safety level
          <input name="safety_rank" defaultValue={existingApplication?.safety_rank} className="rounded border border-white/10 bg-black p-3 text-white" required disabled={disabled} />
          <Helper>Use your known league/platform safety level, or write “new driver”.</Helper>
          <FieldError message={state.fieldErrors?.safety_rank} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Team name, optional
          <input name="team_name" defaultValue={existingApplication?.team_name} className="rounded border border-white/10 bg-black p-3 text-white" disabled={disabled} />
          <Helper>Leave blank if you are applying as an independent driver.</Helper>
        </label>
      </div>

      <div className="grid gap-4 rounded border border-white/10 bg-white/5 p-4">
        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Previous league experience
          <select name="previous_league_experience" value={hasExperience} onChange={(event) => setHasExperience(event.target.value)} className="rounded border border-white/10 bg-black p-3 text-white" disabled={disabled}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
          <Helper>Helps race control place drivers in suitable classes and briefings.</Helper>
        </label>

        {hasExperience === "yes" ? (
          <label className="grid gap-2 text-sm font-semibold text-zinc-300">
            Previous league experience details
            <textarea name="previous_league_experience_details" defaultValue={existingApplication?.previous_league_experience_details} className="min-h-28 rounded border border-white/10 bg-black p-3 text-white" required disabled={disabled} />
            <FieldError message={state.fieldErrors?.previous_league_experience_details} />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Has teammate/friend
          <select name="has_teammate" value={hasTeammate} onChange={(event) => setHasTeammate(event.target.value)} className="rounded border border-white/10 bg-black p-3 text-white" disabled={disabled}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
          <Helper>Used for team placement and entry-list coordination.</Helper>
        </label>

        {hasTeammate === "yes" ? (
          <label className="grid gap-2 text-sm font-semibold text-zinc-300">
            Teammate/friend name or Discord
            <input name="teammate_info" defaultValue={existingApplication?.teammate_info} className="rounded border border-white/10 bg-black p-3 text-white" required disabled={disabled} />
            <FieldError message={state.fieldErrors?.teammate_info} />
          </label>
        ) : null}
      </div>

      {state.message ? (
        <div className={`flex items-start gap-3 rounded border p-4 text-sm ${state.ok ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-50" : "border-red-400/30 bg-red-500/10 text-red-100"}`}>
          {state.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {state.message}
        </div>
      ) : null}

      {!configured ? (
        <div className="rounded border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-50">
          Driver applications are not open yet. Race control will announce registration windows through the league channels.
        </div>
      ) : null}

      {configured && !signedIn ? (
        <div className="rounded border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-50">
          Sign in is required before submitting a driver application.
        </div>
      ) : null}

      <button
        className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-45"
        type="submit"
        disabled={disabled || pending}
      >
        <Send size={16} />
        {pending ? "Submitting..." : existingApplication?.status === "pending" ? "Update Pending Application" : "Submit Application"}
      </button>
    </form>
  );
}
