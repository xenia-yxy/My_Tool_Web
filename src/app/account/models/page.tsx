import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AiModelConfigManager } from "@/components/account/ai-model-config-manager";
import { Button } from "@/components/ui/button";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AccountModelsPage() {
  await requireSignedInUser("/account/models");

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="secondary">
            <Link href="/account">返回用户中心</Link>
          </Button>
        </div>

        <section>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
            <KeyRound aria-hidden="true" className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">
            AI 模型配置
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            添加不同供应商的模型 API Key，并标记它支持的能力。生成图片、Agent
            和后续多模态功能会优先使用你的可用配置。
          </p>
        </section>

        <AiModelConfigManager />
      </div>
    </main>
  );
}
