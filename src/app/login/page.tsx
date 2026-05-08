import { AuthForm } from "@/components/auth-form";
import { Card, SectionHeader } from "@/components/card";

export default function LoginPage() {
  return (
    <section className="mx-auto grid min-h-[70vh] max-w-5xl items-center px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <SectionHeader
          eyebrow="Account Access"
          title="Sign In"
          body="Use your league account to manage your driver application and race-control submissions."
        />
        <Card>
          <AuthForm mode="login" />
        </Card>
      </div>
    </section>
  );
}
