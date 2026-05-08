import { cn } from "@/lib/utils";
import type { LmuClass } from "@/types/league";

const classTones: Record<LmuClass | "Multi-class", string> = {
  Hypercar: "border-red-400/40 bg-red-500/10 text-red-100",
  LMP2: "border-blue-400/40 bg-blue-500/10 text-blue-100",
  LMGT3: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  "Multi-class": "border-cyan-400/40 bg-cyan-400/10 text-cyan-100",
};

function classValue(value: string): LmuClass | "Multi-class" {
  return value === "Hypercar" || value === "LMP2" || value === "LMGT3" || value === "Multi-class" ? value : "Multi-class";
}

export function ClassBadge({ value, className }: Readonly<{ value: string; className?: string }>) {
  const toneKey = classValue(value);
  return (
    <span className={cn("inline-flex items-center gap-2 rounded border px-2.5 py-1 text-xs font-black uppercase tracking-[0.16em]", classTones[toneKey], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}
