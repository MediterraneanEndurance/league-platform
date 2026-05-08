import { CheckCircle2, CircleDot, FileText, MailCheck, UserPlus } from "lucide-react";
import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";
import { DriverApplicationForm } from "@/components/driver-application-form";
import { getAuthState } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const onboardingSteps = [
  ["Create Account", "Register with the email you will use for league operations.", UserPlus],
  ["Verify Email", "Confirm your account from the Supabase email before applying.", MailCheck],
  ["Submit Driver Application", "Send your car number, class, Steam ID and race-control details.", FileText],
  ["Await Review", "Race Control approves entries or returns focused feedback.", CheckCircle2],
] as const;

async function getExistingApplication(userId?: string) {
  if (!userId) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("driver_applications")
    .select("display_name, real_name, age, country, discord_username, steam_id, car_number, preferred_class, preferred_car, safety_rank, previous_league_experience, previous_league_experience_details, has_teammate, teammate_info, team_name, status, rejection_note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

function statusCopy(status?: string) {
  if (status === "approved") {
    return "Approved drivers are eligible for published entry lists and race-week communications.";
  }
  if (status === "rejected") {
    return "Race Control returned feedback. Update the requested details before applying again.";
  }
  if (status === "pending") {
    return "Your application is in the review queue. You can update it until Race Control makes a decision.";
  }
  return "Create an account, verify your email, then submit your Season 1 driver application.";
}

export default async function RegisterPage() {
  const auth = await getAuthState();
  const existingApplication = await getExistingApplication(auth.userId);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionHeader
          eyebrow="Driver Application"
          title="Register / Apply To Race"
          body="Create your account, verify the email, then submit the driver details Race Control needs for Season 1 entry review."
        />
        <Badge>{existingApplication?.status ?? "application"}</Badge>
      </div>

      <Card className="mb-6 border-cyan-400/20 bg-[linear-gradient(135deg,rgba(8,47,73,0.22),rgba(9,9,11,0.9))]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {onboardingSteps.map(([title, body, Icon], index) => (
            <div key={title} className="rounded border border-white/10 bg-black/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="grid size-9 place-items-center rounded bg-cyan-300 text-sm font-black text-black">{index + 1}</span>
                <Icon className="text-cyan-200" size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-6 border-white/10 bg-black/45">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              <CircleDot size={16} /> Application Status
            </p>
            <h2 className="text-2xl font-black uppercase text-white">{existingApplication?.status ?? "Not Submitted"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{statusCopy(existingApplication?.status)}</p>
          </div>
          <Badge>{auth.userId ? "Account active" : "Account required"}</Badge>
        </div>
        {existingApplication?.status === "rejected" && existingApplication.rejection_note ? (
          <div className="mt-5 rounded border border-amber-400/30 bg-amber-400/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">Application Feedback</p>
            <p className="mt-2 text-sm leading-6 text-amber-50">{existingApplication.rejection_note}</p>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="grid gap-4">
          <Card className="border-cyan-400/20 bg-cyan-400/5">
            <h2 className="text-xl font-black uppercase text-white">Application Review</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Race control checks identity, duplicate entries, preferred class, safety level and previous league experience before approval.
            </p>
          </Card>
          <Card>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white">Status Flow</h3>
            <div className="mt-4 grid gap-3 text-sm text-zinc-400">
              <p><span className="font-semibold text-cyan-200">Pending:</span> driver can edit application before approval.</p>
              <p><span className="font-semibold text-cyan-200">Approved:</span> admin creates or updates the driver profile.</p>
              <p><span className="font-semibold text-cyan-200">Rejected:</span> application is retained with a race-control note.</p>
            </div>
          </Card>
        </div>

        <Card>
          <DriverApplicationForm
            configured={auth.configured}
            signedIn={Boolean(auth.userId)}
            existingApplication={existingApplication}
          />
        </Card>
      </div>
    </section>
  );
}
