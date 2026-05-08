import { AuthForm } from "@/components/auth-form";
import { Card, SectionHeader } from "@/components/card";

export default function SignupPage() {
  return (
    <section className="mx-auto grid min-h-[70vh] max-w-5xl items-center px-4 py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <SectionHeader
          eyebrow="Create Account"
          title="Join The Platform"
          body="Create a league account to submit a driver application and follow race-control updates."
        />
        <Card>
          <AuthForm mode="signup" />
        </Card>
      </div>
    </section>
  );
}
