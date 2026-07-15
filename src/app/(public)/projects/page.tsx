import Link from "next/link";
import { ArrowLeft, PanelsTopLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await requireSignedInUser("/projects");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(221,214,254,0.45),transparent_34rem),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-12">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="secondary">
          <Link href="/">
            <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </Button>

        <section className="mt-12 rounded-2xl border border-white/80 bg-white/72 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-violet-700">
            <PanelsTopLeft aria-hidden="true" className="h-5 w-5" />
          </div>
          <Badge className="mt-6" variant="secondary">
            即将上线
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            项目展示
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            项目展示即将上线，后续展示正在构建的工具、产品和案例。
          </p>
        </section>
      </div>
    </main>
  );
}
