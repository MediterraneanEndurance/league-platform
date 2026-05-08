export default function Loading() {
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-7xl place-items-center px-4">
      <div className="w-full max-w-md rounded border border-white/10 bg-zinc-950/80 p-6 text-center">
        <div className="mx-auto mb-4 h-1.5 w-32 overflow-hidden rounded bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded bg-cyan-300" />
        </div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-white">Loading race control</p>
        <p className="mt-2 text-sm text-zinc-500">Preparing league data and session views.</p>
      </div>
    </div>
  );
}
