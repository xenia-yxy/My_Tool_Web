import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-5 lg:px-8">
      <div className="flex min-h-[calc(100svh-80px)] flex-col items-center justify-center pb-12 text-center">
        <h1 className="home-statement hero-title text-5xl font-semibold leading-[1.08] sm:text-7xl lg:text-[9rem]">
          简即繁，慢即快
        </h1>
      </div>

      <nav aria-label="创作入口" className="home-trajectory grid gap-3 pb-8 md:grid-cols-3">
        {[
          { label: "商品视觉", href: "/tools/menswear", tone: "home-entry-blue" },
          { label: "内容创作", href: "/tools/platform-cover-design", tone: "home-entry-pink" },
          { label: "创作画布", href: "/tools/creative-center/canvas", tone: "home-entry-lime" },
        ].map((entry) => (
          <Link className={`home-entry ${entry.tone}`} href={entry.href} key={entry.href}>
            <span>{entry.label}</span>
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ))}
      </nav>
    </section>
  );
}
