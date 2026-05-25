import Link from "next/link";
import { navItems } from "@/components/home/home-data";

const primaryNavItems = navItems.filter((item) => item.href !== "#contact");

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/94 backdrop-blur-xl">
      <div className="flex min-h-16 w-full flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3 sm:px-8 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-6 lg:px-12 xl:px-14">
        <Link
          className="order-1 text-lg font-semibold tracking-normal text-slate-950"
          href="/"
        >
          AI Practice
        </Link>

        <nav
          aria-label="主导航"
          className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 md:order-2 md:w-auto md:justify-center"
        >
          {primaryNavItems.map((item) => (
            <Link
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-950"
              href={item.href}
              key={item.href}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3 md:ml-0 md:justify-end">
          <Link
            className="inline-flex h-10 min-w-[68px] items-center justify-center rounded-full border border-slate-300 px-4 text-sm font-medium text-slate-800 transition-colors hover:border-slate-950 hover:bg-slate-950 hover:text-white"
            href="#contact"
          >
            联系
          </Link>
          <Link
            className="px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950"
            href="/admin"
          >
            登录
          </Link>
        </div>
      </div>
    </header>
  );
}
