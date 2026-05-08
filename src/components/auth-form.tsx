"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LogIn, UserPlus } from "lucide-react";
import { loginAction, signupAction } from "@/app/auth/actions";
import type { AuthActionState } from "@/app/auth/auth-types";

const initialState: AuthActionState = {
  ok: false,
  message: "",
};

export function AuthForm({ mode }: Readonly<{ mode: "login" | "signup" }>) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-zinc-300">
        Email
        <input
          className="rounded border border-white/10 bg-black p-3 text-white"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-zinc-300">
        Password
        <input
          className="rounded border border-white/10 bg-black p-3 text-white"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={8}
          required
        />
      </label>

      {isSignup ? (
        <label className="grid gap-2 text-sm font-semibold text-zinc-300">
          Confirm password
          <input
            className="rounded border border-white/10 bg-black p-3 text-white"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
      ) : null}

      {state.message ? (
        <div className={`flex items-start gap-3 rounded border p-4 text-sm ${state.ok ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-50" : "border-red-400/30 bg-red-500/10 text-red-100"}`}>
          {state.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {state.message}
        </div>
      ) : null}

      <button
        className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
        disabled={pending}
      >
        {isSignup ? <UserPlus size={16} /> : <LogIn size={16} />}
        {pending ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-cyan-200">
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
