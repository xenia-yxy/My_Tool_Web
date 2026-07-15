import { WebsiteBookmarkManager } from "@/components/tools/website-bookmark-manager";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";

export const dynamic = "force-dynamic";

export default function WebsiteBookmarksPage() {
  return (
    <>
      <WorkspacePageHeader
        description="保存常用网站、网页摘要和外部工具，后续可沉淀成自己的资料库。"
        title="网站库"
      />
      <WebsiteBookmarkManager />
    </>
  );
}
