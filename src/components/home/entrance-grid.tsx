import Link from "next/link";
import { ArrowUpRight, BookOpen, BriefcaseBusiness, Hammer, PanelsTopLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { entrances, type EntranceItem } from "@/components/home/home-data";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const accentStyles: Record<EntranceItem["accent"], string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const iconMap: Record<string, LucideIcon> = {
  公开知识库: BookOpen,
  自研工具台: Hammer,
  项目展示: PanelsTopLeft,
  "SOP 企业服务": BriefcaseBusiness,
};

function statusVariant(status: EntranceItem["status"]) {
  if (status === "已开放") return "success";
  if (status === "内测中") return "default";
  return "secondary";
}

export function EntranceGrid() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 lg:px-8" id="entrances">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">入口矩阵</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
            从首页进入我的知识、工具、项目和服务
          </h2>
        </div>
        <p className="max-w-lg text-sm leading-6 text-slate-600">
          对外是可浏览的个人名片，对内会逐步长成我的工作台和产品系统。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {entrances.map((item) => {
          const Icon = iconMap[item.title];

          return (
            <Link href={item.href} key={item.href}>
              <Card className="group h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_22px_70px_rgba(37,99,235,0.13)]">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-lg border ${accentStyles[item.accent]}`}
                    >
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </div>
                  <CardTitle className="pt-2">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center text-sm font-medium text-slate-700 transition-colors group-hover:text-blue-700">
                    进入查看
                    <ArrowUpRight aria-hidden="true" className="ml-1 h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
