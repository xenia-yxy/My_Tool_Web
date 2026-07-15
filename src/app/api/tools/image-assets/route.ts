import { NextResponse } from "next/server";
import {
  deleteAiImageAssets,
  listAiImageGalleryItems,
  listAiImageJobs,
} from "@/server/ai-image-assets";
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
  const mode = url.searchParams.get("mode");
  const status = url.searchParams.get("status");
  const take = Number(url.searchParams.get("take") || 120);
  const [assets, jobs] = await Promise.all([
    listAiImageGalleryItems({
      authorId: session.user.id,
      mode,
      status,
      take,
    }),
    listAiImageJobs({
      authorId: session.user.id,
      mode,
      take: 60,
    }),
  ]);

  return NextResponse.json({ assets, jobs });
}

export async function DELETE(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { ids?: unknown };
    const deletedAssets = await deleteAiImageAssets(session.user.id, body);

    return NextResponse.json({
      deleted: true,
      ids: deletedAssets.map((asset) => asset.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除失败" },
      { status: 400 },
    );
  }
}
