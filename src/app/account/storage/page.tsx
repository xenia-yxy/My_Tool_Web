import Link from "next/link";
import { HardDrive } from "lucide-react";
import { ImageCleanupManager } from "@/components/account/image-cleanup-manager";
import { Button } from "@/components/ui/button";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AccountStoragePage() {
  await requireAdminUser();

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <Button asChild className="w-fit" variant="secondary">
          <Link href="/account">返回用户中心</Link>
        </Button>
        <section>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
            <HardDrive aria-hidden="true" className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">
            图片清理中心
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            统一清理生成图、素材图、选品图、IP 图和服务器本地残留文件。此页面只对管理员开放。
          </p>
        </section>
        <ImageCleanupManager />
      </div>
    </main>
  );
}
