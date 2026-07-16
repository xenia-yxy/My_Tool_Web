import { NextResponse } from "next/server";
import {
  createWebsiteBookmark,
  listWebsiteBookmarks,
} from "@/server/website-bookmarks";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const result = await listWebsiteBookmarks(session.user.id, {
    category: url.searchParams.get("category"),
    query: url.searchParams.get("q"),
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const bookmark = await createWebsiteBookmark(session.user.id, body);

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "网站保存失败" },
      { status: 400 },
    );
  }
}
