import Link from "next/link";
import { ArrowUpRight, FileText, Rocket, Wrench } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { FeaturedItem } from "@/components/home/home-data";
import {
  featuredKnowledge,
  featuredProjects,
  featuredTools,
} from "@/components/home/home-data";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FeaturedGroupProps = {
  title: string;
  description: string;
  items: FeaturedItem[];
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

function FeaturedGroup({ title, description, items, icon: Icon }: FeaturedGroupProps) {
  return (
    <div className="min-w-0">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>即将上线</CardTitle>
              <CardDescription>内容正在准备中。</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          items.map((item) => (
            <Link href={item.href} key={`${title}-${item.title}`}>
              <Card className="group h-full transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_60px_rgba(15,23,42,0.09)]">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{item.meta}</Badge>
                    {item.status ? <Badge>{item.status}</Badge> : null}
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center text-sm font-medium text-slate-700 transition-colors group-hover:text-blue-700">
                    查看详情
                    <ArrowUpRight aria-hidden="true" className="ml-1 h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function FeaturedSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 lg:px-8">
      <div className="mb-7 max-w-2xl">
        <p className="text-sm font-medium text-blue-700">正在生长的内容资产</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
          先展示方向，再持续填充真实内容
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          MVP 阶段先把入口和表达做好，后续再把笔记、工具和项目逐步上线。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <FeaturedGroup
          description="用真实工作经验沉淀 AI 实践判断。"
          icon={FileText}
          items={featuredKnowledge}
          title="知识库"
        />
        <FeaturedGroup
          description="先解决自己的效率问题，再筛选可公开能力。"
          icon={Wrench}
          items={featuredTools}
          title="工具"
        />
        <FeaturedGroup
          description="把实验、产品和服务逐步整理成可展示资产。"
          icon={Rocket}
          items={featuredProjects}
          title="项目"
        />
      </div>
    </section>
  );
}
