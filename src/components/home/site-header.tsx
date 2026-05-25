import Link from "next/link";
import { Sparkles } from "lucide-react";
import { navItems } from "@/components/home/home-data";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/78 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Link
          className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-950"
          href="/"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition-colors group-hover:bg-blue-100">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-none">
            <span>YXY AI Practice</span>
            <span className="mt-1 text-xs font-normal text-slate-500">
              AI 实践者数字据点
            </span>
          </span>
        </Link>

        <nav aria-label="主导航" className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
              href={item.href}
              key={item.href}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
