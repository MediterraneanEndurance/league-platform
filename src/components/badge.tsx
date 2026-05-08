import { cn, statusTone } from "@/lib/utils";

export function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        tone ? tone : statusTone(String(children).toLowerCase().replaceAll(" ", "_")),
      )}
    >
      {children}
    </span>
  );
}
