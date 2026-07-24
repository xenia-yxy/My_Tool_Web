import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { LoginPrompt } from "@/components/home/login-prompt";
import { homeCopy } from "@/content/home-copy";

export function HeroSection() {
  return (
    <section className="mx-auto grid w-full max-w-[1500px] flex-1 items-center gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[minmax(0,0.95fr)_420px] lg:px-10 xl:px-14">
      <div className="max-w-5xl pt-6 lg:pt-0">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/78 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-blue-600" />
          {homeCopy.eyebrow}
        </div>

        <h1 className="hero-title max-w-[12ch] break-words text-5xl font-semibold leading-[1.04] text-slate-950 sm:text-7xl lg:text-[6.8rem]">
          {homeCopy.hero}
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-9 text-slate-600 sm:text-xl">
          {homeCopy.intro}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <LoginPrompt />
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
            <LockKeyhole aria-hidden="true" className="h-4 w-4" />
            {homeCopy.signInHint}
          </span>
        </div>
      </div>

      <aside className="w-full max-w-md justify-self-start rounded-2xl border border-white/80 bg-white/72 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:justify-self-end">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">{homeCopy.sideEyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {homeCopy.sideTitle}
            </h2>
          </div>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {homeCopy.sideBadge}
          </span>
        </div>

        <div className="mt-6 grid gap-3">
          {homeCopy.sideItems.map((item) => (
            <div
              className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/78 px-3 py-3 text-sm text-slate-700"
              key={item}
            >
              <ArrowRight aria-hidden="true" className="h-4 w-4 text-blue-600" />
              {item}
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
