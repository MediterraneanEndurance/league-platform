import { CircleDashed } from "lucide-react";

export function EmptyState({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <div className="grid place-items-center rounded border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
      <CircleDashed className="mb-3 text-zinc-500" size={24} />
      <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{body}</p>
    </div>
  );
}
