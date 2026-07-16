import Link from "next/link";
import { ToolDirectory } from "@/components/tools/tool-directory";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function ToolDirectoryPage() {
  return (
    <>
      <WorkspacePageHeader
        description="旧版站外工具导航仍保留；新的可存储、可搜索、可总结版本在网站库里。"
        title="网站工具汇总"
      />
      <div className="grid gap-5">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <Badge variant="secondary">新版入口</Badge>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            现在推荐使用网站库，支持保存网址、摘要、标签和分类筛选。
          </p>
          <Button asChild className="mt-4">
            <Link href="/tools/sites">进入网站库</Link>
          </Button>
        </div>
        <ToolDirectory />
      </div>
    </>
  );
}
