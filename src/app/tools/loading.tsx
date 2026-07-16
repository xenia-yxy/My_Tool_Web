export default function ToolsLoading() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-7 text-slate-950">
      <div className="mx-auto grid w-full max-w-[1500px] gap-5 lg:grid-cols-[236px_1fr]">
        <div className="hidden rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm lg:block">
          <div className="h-12 rounded-xl bg-slate-100" />
          <div className="mt-4 grid gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="h-10 rounded-xl bg-slate-100" key={index} />
            ))}
          </div>
        </div>
        <section className="grid gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <div className="h-4 w-28 rounded bg-blue-100" />
            <div className="mt-3 h-9 w-56 rounded bg-slate-100" />
            <div className="mt-3 h-4 max-w-lg rounded bg-slate-100" />
            <div className="mt-5 flex gap-2 overflow-hidden lg:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="h-11 w-28 shrink-0 rounded-full bg-slate-100" key={index} />
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="h-44 rounded-2xl border border-slate-200 bg-white/80 shadow-sm" key={index} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
