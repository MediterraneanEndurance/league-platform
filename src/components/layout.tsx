"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Gauge, Home, Menu, Radio, ShieldCheck, Trophy, X } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { PwaInstall } from "@/components/pwa-install";
import { VisitTracker } from "@/components/visit-tracker";
import { leagueConfig } from "@/lib/league-config";
import type { AuthState } from "@/lib/auth";
import { canAccessAdmin, canAccessSteward } from "@/lib/roles";

const nav = [
  ["Home", "/"],
  ["Race Control", "/race-control"],
  ["Calendar", "/calendar"],
  ["Standings", "/standings"],
  ["Drivers", "/drivers"],
  ["Teams", "/teams"],
  ["Results", "/results"],
  ["Rules", "/rules"],
  ["Decisions", "/stewards/decisions"],
  ["Live", "/live"],
];

const protectedPrefixes = ["/admin", "/steward"];
const mobileQuickNav = [
  ["Home", "/", Home],
  ["Calendar", "/calendar", CalendarDays],
  ["Standings", "/standings", Trophy],
  ["Live", "/live", Radio],
] as const;

function shouldPrefetch(href: string) {
  return protectedPrefixes.every((prefix) => href !== prefix && !href.startsWith(`${prefix}/`));
}

export function SiteShell({ children, auth }: Readonly<{ children: React.ReactNode; auth: AuthState }>) {
  const [open, setOpen] = useState(false);
  const navItems = [
    ...nav,
    ...(canAccessSteward(auth.role) ? [["Race Control", "/steward"] as [string, string]] : []),
    ...(canAccessAdmin(auth.role) ? [["Admin", "/admin"] as [string, string]] : []),
  ];
  const desktopNavItems = navItems.filter(([label]) => !["Teams", "Rules", "Decisions", "Live"].includes(label));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050608] text-zinc-100">
      <VisitTracker />
      <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#050608]/90 backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 pr-14 sm:px-4 sm:pr-16 xl:pr-4">
          <Link href="/" className="flex min-w-0 shrink items-center gap-3" onClick={() => setOpen(false)}>
            <span className="grid size-9 shrink-0 place-items-center rounded bg-red-600 text-white shadow-lg shadow-red-600/25 sm:size-10">
              <Gauge size={22} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black uppercase tracking-[0.2em] text-white">{leagueConfig.shortName}</span>
              <span className="hidden truncate text-xs uppercase tracking-[0.18em] text-zinc-500 2xl:block">{leagueConfig.leagueName}</span>
            </span>
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex">
            {desktopNavItems.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                prefetch={shouldPrefetch(href)}
                className="whitespace-nowrap rounded px-2.5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-zinc-400 transition hover:bg-white/5 hover:text-white 2xl:px-3 2xl:text-xs 2xl:tracking-[0.12em]"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <a
              href={leagueConfig.discordUrl}
              className="hidden rounded border border-cyan-400/40 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-cyan-100 transition hover:bg-cyan-400/10 2xl:inline-flex"
            >
              Discord
            </a>
            <Link
              href="/register"
              className="rounded bg-red-600 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-red-500"
            >
              Apply
            </Link>
            {auth.userId ? (
              <form action={logoutAction}>
                <button className="rounded border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-zinc-200 transition hover:bg-white/5" type="submit">
                  Logout
                </button>
              </form>
            ) : (
              <>
                <Link href="/login" className="rounded border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-zinc-200 transition hover:bg-white/5">
                  Login
                </Link>
                <Link href="/signup" className="rounded border border-cyan-400/40 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-cyan-100 transition hover:bg-cyan-400/10">
                  Signup
                </Link>
              </>
            )}
          </div>
          <div className="absolute right-3 top-3 flex shrink-0 items-center gap-2 sm:right-4 xl:hidden">
            <button
              className="rounded border border-white/10 p-2 text-zinc-300"
              aria-label="Toggle navigation"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {open ? (
          <nav className="border-t border-white/10 bg-black px-4 py-4 xl:hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {navItems.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  prefetch={shouldPrefetch(href)}
                  className="rounded border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold text-zinc-200"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-3">
              <PwaInstall />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
              <a href={leagueConfig.discordUrl} className="rounded border border-cyan-400/40 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-cyan-100">
                Discord
              </a>
              <Link href="/register" className="rounded bg-red-600 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white" onClick={() => setOpen(false)}>
                Apply
              </Link>
              {auth.userId ? (
                <form action={logoutAction} className="col-span-2">
                  <button className="w-full rounded border border-white/10 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-zinc-200" type="submit">
                    Logout
                  </button>
                </form>
              ) : (
                <>
                  <Link href="/login" className="rounded border border-white/10 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-zinc-200" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                  <Link href="/signup" className="rounded border border-cyan-400/40 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-cyan-100" onClick={() => setOpen(false)}>
                    Signup
                  </Link>
                </>
              )}
            </div>
          </nav>
        ) : null}
      </div>
      <main className="pb-[5.5rem] pt-20 lg:pb-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050608]/95 px-3 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {mobileQuickNav.map(([label, href, Icon]) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded text-[0.66rem] font-black uppercase tracking-[0.08em] text-zinc-400 transition hover:bg-white/5 hover:text-white"
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <footer className="border-t border-white/10 bg-black px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_1.85fr]">
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-white">
                <ShieldCheck size={18} className="text-cyan-300" /> {leagueConfig.shortName}
              </div>
              <p className="max-w-md text-sm leading-6 text-zinc-500">
                Community-driven endurance competition with race-control standards, multi-class grids and a calm sporting code.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["League", "/"],
                ["Competition", "/standings"],
                ["Stewarding", "/stewards/decisions"],
                ["Broadcast", "/live"],
                ["Rules", "/rules"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 transition hover:text-white">
                  {label}
                </Link>
              ))}
              <a href={leagueConfig.discordUrl} className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200 transition hover:text-cyan-100">
                Discord
              </a>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-xs uppercase tracking-[0.16em] text-zinc-600">
            © Mediterranean Endurance League
          </div>
        </div>
      </footer>
    </div>
  );
}
