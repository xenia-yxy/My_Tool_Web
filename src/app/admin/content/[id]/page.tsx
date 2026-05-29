import { AdminShell } from "@/components/admin/admin-shell";
import { ContentEditor } from "@/components/admin/content-editor";
import { requireAdminUser } from "@/server/auth";
import { getAdminContentAsset } from "@/server/content-queries";

export const dynamic = "force-dynamic";

type EditContentAssetPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditContentAssetPage({
  params,
}: EditContentAssetPageProps) {
  await requireAdminUser();
  const { id } = await params;
  const note = await getAdminContentAsset(id);

  return (
    <AdminShell
      description="编辑 Markdown 内容，控制草稿、发布和撤回状态。"
      title="编辑内容"
    >
      <ContentEditor
        note={{
          id: note.id,
          title: note.title,
          slug: note.slug,
          excerpt: note.excerpt,
          content: note.content,
          status: note.status === "PUBLISHED" ? "PUBLISHED" : "PRIVATE",
        }}
      />
    </AdminShell>
  );
}
