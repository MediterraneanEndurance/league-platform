"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type CountdownUnit = "days" | "hours" | "minutes" | "seconds";

type CountdownParts = Record<CountdownUnit, number>;

const labels: Record<CountdownUnit, string> = {
  days: "Days",
  hours: "Hours",
  minutes: "Minutes",
  seconds: "Seconds",
};

function getParts(targetDate: string): CountdownParts {
  const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function formatValue(unit: CountdownUnit, value: number) {
  return unit === "days" ? String(value) : String(value).padStart(2, "0");
}

export function CountdownTimer({
  targetDate,
  units = ["days", "hours", "minutes", "seconds"],
  className,
  cellClassName,
  valueClassName,
  labelClassName,
}: Readonly<{
  targetDate: string;
  units?: CountdownUnit[];
  className?: string;
  cellClassName?: string;
  valueClassName?: string;
  labelClassName?: string;
}>) {
  const [parts, setParts] = useState<CountdownParts>(() => getParts(targetDate));

  useEffect(() => {
    const interval = window.setInterval(() => setParts(getParts(targetDate)), 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={cn("grid gap-2", className)}>
      {units.map((unit) => (
        <div key={unit} className={cn("rounded border border-white/10 bg-white/5 p-3 text-center", cellClassName)}>
          <p className={cn("text-2xl font-black text-white", valueClassName)}>
            {formatValue(unit, parts[unit])}
          </p>
          <p className={cn("text-[0.66rem] font-black uppercase tracking-[0.12em] text-zinc-500", labelClassName)}>
            {labels[unit]}
          </p>
        </div>
      ))}
    </div>
  );
}
