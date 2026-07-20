import { NextResponse } from "next/server";
import {
  buildProductAnalysisPrompt,
  normalizeProductAnalysis,
} from "@/lib/product-analysis";
import { buildAiRuntimeConfigsForUser } from "@/server/ai-model-configs";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { createAiGateway } from "@/server/ai-gateway/provider-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxUploadBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const images = formData.getAll("image").filter((value): value is File => value instanceof File).slice(0, 8);
    if (images.length === 0) throw new Error("请先上传至少一张商品图片");

    for (const image of images) {
      if (!allowedImageTypes.has(image.type)) throw new Error("仅支持 PNG、JPG、WebP 图片");
      if (image.size > maxUploadBytes) throw new Error("单张识别图片不能超过 8MB");
    }

    const imageDataUrls = await Promise.all(images.map(async (image) =>
      `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`,
    ));
    const categoryHint = text(formData, "categoryHint");
    const notes = text(formData, "notes");
    const gateway = createAiGateway({
      models: await buildAiRuntimeConfigsForUser(session.user.id),
    });
    const content = await gateway.generateVisionText({
      imageDataUrls,
      prompt: "请综合分析这些同一商品的多张图片，生成一份可编辑的选品档案。",
      systemPrompt: buildProductAnalysisPrompt(categoryHint, notes),
      temperature: 0.2,
    });

    return NextResponse.json({ analysis: normalizeProductAnalysis(content) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI 识别商品失败" },
      { status: 400 },
    );
  }
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, 1_000) : "";
}
