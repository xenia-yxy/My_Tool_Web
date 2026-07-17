import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAiImageAsset } from "@/server/ai-image-assets";
import { saveReferenceImageToRuntime } from "@/server/ai-image-tools";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { createMenswearMaterial } from "@/server/menswear-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { assetId?: unknown; category?: unknown };
    const assetId = typeof body.assetId === "string" ? body.assetId.trim() : "";
    if (!assetId) throw new Error("请选择需要保存的生成图片");

    const asset = await getAiImageAsset(session.user.id, assetId);
    if (!asset) throw new Error("未找到该生成图片");
    if (asset.status !== "SUCCEEDED") throw new Error("只能保存已成功生成的图片");

    const buffer = await readGeneratedAsset(asset.imageUrl);
    const copy = new File([buffer], asset.fileName || "generated-material.png", {
      type: asset.mimeType || "image/png",
    });
    const imageUrl = await saveReferenceImageToRuntime(copy);
    const material = await createMenswearMaterial(session.user.id, {
      category: body.category,
      imageUrl,
      name: asset.title,
      promptNotes: asset.prompt,
      sourceType: "GENERATED",
      sourceUrl: asset.imageUrl,
      tags: [...asset.tags, "AI生成"],
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存到素材库失败" },
      { status: 400 },
    );
  }
}

async function readGeneratedAsset(imageUrl: string) {
  const localMatch = imageUrl.match(/^\/api\/uploads\/ai-images\/([^/]+)$/);
  if (localMatch) {
    return readFile(path.join(process.cwd(), ".runtime", "uploads", "ai-images", localMatch[1]));
  }

  if (!/^https?:\/\//i.test(imageUrl)) {
    throw new Error("生成图片地址不可复制");
  }

  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("读取生成图片失败");
  return Buffer.from(await response.arrayBuffer());
}
