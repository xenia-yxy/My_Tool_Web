import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(167,243,208,0.45),transparent_34rem),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-12">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="secondary">
          <Link href="/">
            <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </Button>

        <section className="mt-12 rounded-2xl border border-white/80 bg-white/72 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
            <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
          </div>
          <Badge className="mt-6" variant="success">
            服务入口预留
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            SOP 企业服务
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            SOP 服务即将上线，后续展示自动化流程、企业服务和咨询入口。
          </p>
        </section>
      </div>
    </main>
  );
}
