import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LoginPrompt } from "@/components/home/login-prompt";
import { homeCopy } from "@/content/home-copy";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/66 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link
          className="group inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-950"
          href="/"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition-colors group-hover:bg-blue-100">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span>{homeCopy.brand}</span>
            <span className="mt-1 text-xs font-normal text-slate-500">{homeCopy.brandSubtitle}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            className="inline-flex h-10 shrink-0 items-center rounded-full px-3 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
            href="mailto:hello@xenia.local"
          >
            联系
          </Link>
          <LoginPrompt autoOpenFromQuery />
        </div>
      </div>
    </header>
  );
}
