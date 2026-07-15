import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import {
  buildAiImageZipArchive,
  getAiImageAsset,
  normalizeAiImageAssetZipDownloadInput,
} from "@/server/ai-image-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxArchiveBytes = 48 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { ids?: unknown };
    const ids = normalizeAiImageAssetZipDownloadInput(body);
    const assets = (
      await Promise.all(ids.map((id) => getAiImageAsset(session.user.id, id)))
    ).filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));

    if (assets.length === 0) {
      throw new Error("没有可下载的图片");
    }

    let contentLength = 0;
    const entries = [];
    for (const asset of assets) {
      const assetUrl = new URL(asset.downloadUrl || asset.imageUrl, request.url);
      const response = await fetch(assetUrl);
      if (!response.ok) {
        throw new Error(`无法下载图片：${asset.fileName}`);
      }
      const content = Buffer.from(await response.arrayBuffer());
      contentLength += content.length;
      if (contentLength > maxArchiveBytes) {
        throw new Error("所选图片超过 48MB，请减少选择数量后重试");
      }
      entries.push({ content, fileName: asset.fileName });
    }

    const archive = buildAiImageZipArchive(entries);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return new Response(archive, {
      headers: {
        "Content-Disposition": `attachment; filename="ai-images-${timestamp}.zip"`,
        "Content-Type": "application/zip",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "打包下载失败" },
      { status: 400 },
    );
  }
}
