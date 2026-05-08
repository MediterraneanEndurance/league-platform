import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-zinc-950/75 p-4 shadow-2xl shadow-black/20 transition duration-200 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  body,
}: Readonly<{ eyebrow?: string; title: string; body?: string }>) {
  return (
    <div className="mb-6 max-w-3xl">
      {eyebrow ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300 sm:tracking-[0.32em]">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl font-black uppercase leading-tight tracking-wide text-white md:text-3xl">{title}</h2>
      {body ? <p className="mt-3 text-sm leading-6 text-zinc-400 md:text-base">{body}</p> : null}
    </div>
  );
}
