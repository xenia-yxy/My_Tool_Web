import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AiModelConfigManager } from "@/components/account/ai-model-config-manager";
import { Button } from "@/components/ui/button";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AccountModelsPage() {
  await requireSignedInUser("/account/models");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fafc_34%,#f1f5f9_100%)] px-5 py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="secondary">
            <Link href="/account">返回用户中心</Link>
          </Button>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700">
                <KeyRound aria-hidden="true" className="h-5 w-5" />
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-slate-950">
                AI 模型配置
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                添加不同供应商的模型 API Key，按文本、识图、生图、图生图等能力单独指定当前模型。切换后立即生效，Key 不会暴露到浏览器。
              </p>
            </div>
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm text-white shadow-sm">
              <span className="text-xs text-blue-200">配置原则</span>
              <span className="font-medium">能切换，能兜底，能看见当前使用谁</span>
            </div>
          </div>
        </section>

        <AiModelConfigManager />
      </div>
    </main>
  );
}
