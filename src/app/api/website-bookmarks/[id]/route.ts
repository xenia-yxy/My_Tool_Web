import { NextResponse } from "next/server";
import { deleteWebsiteBookmark } from "@/server/website-bookmarks";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const result = await deleteWebsiteBookmark(session.user.id, id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "网站删除失败" },
      { status: 404 },
    );
  }
}
