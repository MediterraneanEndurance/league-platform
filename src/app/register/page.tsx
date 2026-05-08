import { Badge } from "@/components/badge";
import { Card, SectionHeader } from "@/components/card";
import { DriverApplicationForm } from "@/components/driver-application-form";
import { getAuthState } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function getExistingApplication(userId?: string) {
  if (!userId) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("driver_applications")
    .select("display_name, real_name, age, country, discord_username, steam_id, car_number, preferred_class, preferred_car, safety_rank, previous_league_experience, previous_league_experience_details, has_teammate, teammate_info, team_name, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export default async function RegisterPage() {
  const auth = await getAuthState();
  const existingApplication = await getExistingApplication(auth.userId);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionHeader
          eyebrow="Driver Application"
          title="Register / Apply To Race"
          body="Applications are reviewed by race control before a driver is approved for Season 1 entry lists."
        />
        <Badge>{existingApplication?.status ?? "application"}</Badge>
      </div>

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
