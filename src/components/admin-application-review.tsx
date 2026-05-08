"use client";

import { useActionState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  approveDriverApplication,
  rejectDriverApplication,
} from "@/app/admin/application-actions";
import { emptyAdminApplicationState } from "@/app/admin/application-action-types";
import { Badge } from "@/components/badge";

type ApplicationRow = {
  id: string;
  display_name: string;
  real_name: string;
  age: number;
  country: string;
  discord_username: string;
  steam_id: string;
  car_number: number;
  preferred_class: string;
  preferred_car: string;
  safety_rank: string;
  previous_league_experience: boolean;
  previous_league_experience_details?: string | null;
  has_teammate: boolean;
  teammate_info?: string | null;
  team_name?: string | null;
  admin_notes?: string | null;
  status: string;
  created_at: string;
};

function ApplicationCard({ application }: { application: ApplicationRow }) {
  const [approveState, approveAction, approving] = useActionState(approveDriverApplication, emptyAdminApplicationState);
  const [rejectState, rejectAction, rejecting] = useActionState(rejectDriverApplication, emptyAdminApplicationState);

  return (
    <div className="rounded border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">#{application.car_number} | {application.preferred_class}</p>
          <h4 className="mt-1 text-xl font-black uppercase text-white">{application.display_name}</h4>
          <p className="mt-1 text-sm text-zinc-500">{application.real_name} | {application.age} | {application.country}</p>
        </div>
        <Badge>{application.status}</Badge>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <p><span className="text-zinc-500">Discord:</span> <span className="text-zinc-200">{application.discord_username}</span></p>
        <p><span className="text-zinc-500">Steam:</span> <span className="text-zinc-200">{application.steam_id}</span></p>
        <p><span className="text-zinc-500">Preferred car:</span> <span className="text-zinc-200">{application.preferred_car}</span></p>
        <p><span className="text-zinc-500">Safety:</span> <span className="text-zinc-200">{application.safety_rank}</span></p>
        <p><span className="text-zinc-500">Team:</span> <span className="text-zinc-200">{application.team_name || "Independent"}</span></p>
        <p><span className="text-zinc-500">Teammate:</span> <span className="text-zinc-200">{application.has_teammate ? application.teammate_info : "No"}</span></p>
      </div>

      {application.previous_league_experience ? (
        <div className="mt-4 rounded bg-black/40 p-3 text-sm text-zinc-300">
          <span className="font-semibold text-white">Previous experience:</span> {application.previous_league_experience_details}
        </div>
      ) : null}

      {application.admin_notes ? (
        <div className="mt-3 rounded bg-black/40 p-3 text-sm text-zinc-300">
          <span className="font-semibold text-white">Notes:</span> {application.admin_notes}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[auto_1fr]">
        <form action={approveAction}>
          <input type="hidden" name="application_id" value={application.id} />
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded bg-cyan-300 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={approving || rejecting}
          >
            <CheckCircle2 size={16} /> Approve
          </button>
        </form>

        <form action={rejectAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input type="hidden" name="application_id" value={application.id} />
          <input
            className="rounded border border-white/10 bg-black p-3 text-sm text-white"
            name="rejection_note"
            placeholder="Rejection note"
            required
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded border border-red-400/40 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={approving || rejecting}
          >
            <XCircle size={16} /> Reject
          </button>
        </form>
      </div>

      {[approveState, rejectState].map((state, index) =>
        state.message ? (
          <div key={index} className={`mt-3 rounded border p-3 text-sm ${state.ok ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-50" : "border-red-400/30 bg-red-500/10 text-red-100"}`}>
            {state.message}
          </div>
        ) : null,
      )}
    </div>
  );
}

export function AdminApplicationReview({ applications }: { applications: ApplicationRow[] }) {
  if (applications.length === 0) {
    return (
      <div className="rounded border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-zinc-500">
        No pending driver applications.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
    </div>
  );
}
