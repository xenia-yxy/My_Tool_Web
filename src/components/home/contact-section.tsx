import Link from "next/link";
import { ArrowRight, Github, Mail, MessageCircle, Workflow } from "lucide-react";
import { contactActions } from "@/components/home/home-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const contactIcons = [MessageCircle, Workflow, Github];

export function ContactSection() {
  return (
    <section
      className="w-full border-y border-white/80 bg-white/62 py-14 backdrop-blur-xl"
      id="contact"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="flex flex-col justify-between gap-8">
          <div>
            <Badge variant="success">SOP 服务入口预留</Badge>
            <h2 className="mt-4 text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
              如果你也想把 AI 变成可执行流程，这里会成为合作入口
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              后续会把自动化流程、内容生产 SOP、企业内部知识库和工具化交付沉淀到这里。当前阶段先保留清晰入口，
              让访客知道这个网站不仅能看，也能转化为真实合作。
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-11 px-5">
              <Link href="/services">
                查看 SOP 服务
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="h-11 px-5" variant="secondary">
              <Link href="mailto:admin@example.com">
                <Mail aria-hidden="true" className="mr-2 h-4 w-4" />
                邮件联系
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          {contactActions.map((action, index) => {
            const Icon = contactIcons[index] ?? MessageCircle;

            return (
              <Link
                className="group rounded-xl border border-slate-200/80 bg-white/82 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_60px_rgba(37,99,235,0.11)]"
                href={action.href}
                key={action.title}
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{action.title}</h3>
                      <Badge variant="secondary">{action.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-blue-700"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
