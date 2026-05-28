import { AdminShell } from "@/components/admin/admin-shell";
import { ContentEditor } from "@/components/admin/content-editor";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function NewContentAssetPage() {
  await requireAdminUser();

  return (
    <AdminShell
      description="用 Markdown 记录实践、方法论、提示词和流程。保存为草稿时只在后台可见，发布后进入公开知识库。"
      title="新建内容"
    >
      <ContentEditor />
    </AdminShell>
  );
}
