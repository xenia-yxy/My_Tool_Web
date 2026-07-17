import { NextResponse } from "next/server";
import {
  buildMenswearMultiOutfitAnalysisPrompt,
  normalizeMenswearMultiOutfitAnalysis,
} from "@/lib/menswear-multi-outfit-analysis";
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
    const image = formData.get("image");
    if (!(image instanceof File)) throw new Error("请先上传平铺多搭参考图");
    if (!allowedImageTypes.has(image.type)) throw new Error("仅支持 PNG、JPG、WebP 图片");
    if (image.size > maxUploadBytes) throw new Error("识别图片不能超过 8MB");

    const imageDataUrl = `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`;
    const gateway = createAiGateway({ models: await buildAiRuntimeConfigsForUser(session.user.id) });
    const content = await gateway.generateVisionText({
      imageDataUrl,
      prompt: "识别这张平铺多搭参考图中的搭配套数和顺序。",
      systemPrompt: buildMenswearMultiOutfitAnalysisPrompt(),
      temperature: 0,
    });

    return NextResponse.json({ analysis: normalizeMenswearMultiOutfitAnalysis(content) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "平铺搭配识别失败" },
      { status: 400 },
    );
  }
}
